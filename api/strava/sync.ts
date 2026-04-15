import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function getSeasonRange(): Promise<{ start: number; end: number }> {
  const { data } = await supabase
    .from('settings')
    .select('season_start, season_end')
    .single()

  const start = data?.season_start ?? '2026-04-01'
  const end   = data?.season_end   ?? '2026-04-30'

  return {
    start: Math.floor(new Date(start + 'T00:00:00Z').getTime() / 1000),
    end:   Math.floor(new Date(end   + 'T23:59:59Z').getTime() / 1000),
  }
}

async function getValidAccessToken(token: Record<string, any>): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  // token 還有超過 60 秒有效期，直接返回
  if (token.expires_at > now + 60) return token.access_token

  // 重新刷新 token
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: token.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  const refreshed = await res.json()

  await supabase
    .from('runner_tokens')
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      expires_at: refreshed.expires_at,
    })
    .eq('runner_id', token.runner_id)

  return refreshed.access_token
}

async function fetchAllActivities(accessToken: string, seasonStart: number, seasonEnd: number): Promise<any[]> {
  const all: any[] = []
  let page = 1

  while (true) {
    const res = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?after=${seasonStart}&before=${seasonEnd}&per_page=200&page=${page}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )
    const batch = await res.json()
    if (!Array.isArray(batch) || batch.length === 0) break
    all.push(...batch)
    if (batch.length < 200) break
    page++
  }

  return all
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

  const { data: tokens, error: tokensErr } = await supabase
    .from('runner_tokens')
    .select('*')

  if (tokensErr) {
    return res.status(500).json({ error: tokensErr.message })
  }

  if (!tokens || tokens.length === 0) {
    return res.json({ synced: 0, message: '尚未有跑者連結 Strava' })
  }

  const season = await getSeasonRange()

  const settled = await Promise.allSettled(
    tokens.map(async (token) => {
      const accessToken = await getValidAccessToken(token)
      const activities = await fetchAllActivities(accessToken, season.start, season.end)

      const runs = activities.filter(
        (a) => a.sport_type === 'Run' || a.type === 'Run',
      )

      const distance = Math.round(runs.reduce((s, a) => s + (a.distance ?? 0), 0))
      const elevation = Math.round(runs.reduce((s, a) => s + (a.total_elevation_gain ?? 0), 0))
      const activityCount = runs.length

      await supabase
        .from('runners')
        .update({ distance, elevation, activities: activityCount, synced_at: new Date().toISOString() })
        .eq('id', token.runner_id)

      // 儲存每筆活動明細
      if (runs.length > 0) {
        await supabase.from('activities').upsert(
          runs.map((a) => ({
            id: a.id,
            runner_id: token.runner_id,
            name: a.name ?? '',
            distance: Math.round(a.distance ?? 0),
            elevation: Math.round(a.total_elevation_gain ?? 0),
            start_date: a.start_date,
          })),
          { onConflict: 'id' },
        )
      }

      return { runner_id: token.runner_id, success: true, runs: activityCount }
    }),
  )

  const results = settled.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : { runner_id: tokens[i].runner_id, success: false, error: String((r as PromiseRejectedResult).reason) },
  )

  res.json({ synced: results.filter(r => r.success).length, results })
}
