import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

interface ClubActivity {
  athlete: { firstname: string; lastname: string }
  name: string
  distance: number
  total_elevation_gain: number
  sport_type: string
  type: string
  start_date?: string
}

async function getAdminToken(): Promise<string> {
  const { data, error } = await supabase
    .from('settings')
    .select('strava_access_token, strava_refresh_token, strava_expires_at')
    .eq('id', 1)
    .single()

  if (error || !data?.strava_access_token) {
    throw new Error('尚未連結管理員 Strava 帳號，請至管理後台完成授權')
  }

  const now = Math.floor(Date.now() / 1000)
  if (data.strava_expires_at > now + 60) {
    return data.strava_access_token
  }

  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: data.strava_refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  const refreshed = await res.json()

  await supabase
    .from('settings')
    .update({
      strava_access_token: refreshed.access_token,
      strava_refresh_token: refreshed.refresh_token,
      strava_expires_at: refreshed.expires_at,
    })
    .eq('id', 1)

  return refreshed.access_token
}

async function fetchClubActivities(
  accessToken: string,
  clubId: string,
  seasonStart: Date,
): Promise<ClubActivity[]> {
  const all: ClubActivity[] = []
  let page = 1

  while (true) {
    const res = await fetch(
      `https://www.strava.com/api/v3/clubs/${clubId}/activities?per_page=200&page=${page}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )

    if (!res.ok) break

    const batch: ClubActivity[] = await res.json()
    if (!Array.isArray(batch) || batch.length === 0) break

    all.push(...batch)

    // 若 API 有回傳日期，且整頁都早於賽季開始則停止翻頁
    const hasDate = batch.every(a => !!a.start_date)
    if (hasDate && batch.every(a => new Date(a.start_date!) < seasonStart)) break

    if (batch.length < 200) break
    page++
  }

  return all
}

async function getSeasonRange(): Promise<{ start: Date; end: Date; club_id: string }> {
  const { data, error } = await supabase
    .from('settings')
    .select('season_start, season_end, strava_club_id')
    .eq('id', 1)
    .single()

  if (error) throw new Error('無法讀取賽季設定')

  const start = data?.season_start ?? '2026-04-01'
  const end   = data?.season_end   ?? '2026-04-30'

  return {
    start: new Date(start + 'T00:00:00Z'),
    end:   new Date(end   + 'T23:59:59Z'),
    club_id: data?.strava_club_id ?? '',
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Rate limiting：60 秒內只允許一次同步
  const { data: recentSync } = await supabase
    .from('runners')
    .select('synced_at')
    .not('synced_at', 'is', null)
    .order('synced_at', { ascending: false })
    .limit(1)

  if (recentSync?.[0]?.synced_at) {
    const age = (Date.now() - new Date(recentSync[0].synced_at).getTime()) / 1000
    if (age < 60) {
      return res.status(429).json({
        error: `請稍後再試（${Math.ceil(60 - age)} 秒後可再次同步）`,
        retryAfter: Math.ceil(60 - age),
      })
    }
  }

  let season: { start: Date; end: Date; club_id: string }
  try {
    season = await getSeasonRange()
  } catch (e) {
    return res.status(500).json({ error: String(e) })
  }

  if (!season.club_id) {
    return res.status(400).json({ error: '尚未設定 Strava 社團 ID，請至管理後台設定' })
  }

  let accessToken: string
  try {
    accessToken = await getAdminToken()
  } catch (e) {
    return res.status(400).json({ error: String(e) })
  }

  const allActivities = await fetchClubActivities(accessToken, season.club_id, season.start)

  // 過濾：只保留賽季區間內的跑步活動
  const runs = allActivities.filter(a => {
    if (a.sport_type !== 'Run' && a.type !== 'Run') return false
    if (a.start_date) {
      const d = new Date(a.start_date)
      if (d < season.start || d > season.end) return false
    }
    return true
  })

  // 依 Strava 顯示名稱（firstname + lastname）累加
  const byName = new Map<string, { distance: number; elevation: number; count: number }>()
  for (const act of runs) {
    const key = `${act.athlete.firstname} ${act.athlete.lastname}`.trim()
    const cur = byName.get(key) ?? { distance: 0, elevation: 0, count: 0 }
    byName.set(key, {
      distance:  cur.distance  + Math.round(act.distance),
      elevation: cur.elevation + Math.round(act.total_elevation_gain),
      count:     cur.count     + 1,
    })
  }

  const { data: runners } = await supabase
    .from('runners')
    .select('id, strava_name')

  if (!runners || runners.length === 0) {
    return res.json({ synced: 0, message: '尚無跑者資料' })
  }

  const now = new Date().toISOString()
  const results: { runner_id: string; name: string; synced: boolean; reason?: string }[] = []

  for (const runner of runners) {
    const stravaName = runner.strava_name?.trim() ?? ''

    if (!stravaName) {
      results.push({ runner_id: runner.id, name: '(未設定)', synced: false, reason: '未設定 Strava 名稱' })
      continue
    }

    const stats = byName.get(stravaName)

    if (!stats) {
      // 社團中沒有此人的活動（可能本季尚未跑步）
      results.push({ runner_id: runner.id, name: stravaName, synced: true, reason: '本季無活動，清零' })
      await supabase
        .from('runners')
        .update({ distance: 0, elevation: 0, activities: 0, synced_at: now })
        .eq('id', runner.id)
      continue
    }

    const { error } = await supabase
      .from('runners')
      .update({
        distance:   stats.distance,
        elevation:  stats.elevation,
        activities: stats.count,
        synced_at:  now,
      })
      .eq('id', runner.id)

    results.push({ runner_id: runner.id, name: stravaName, synced: !error, reason: error?.message })
  }

  res.json({
    synced:  results.filter(r => r.synced).length,
    total:   runners.length,
    fetched: runs.length,
    results,
  })
}
