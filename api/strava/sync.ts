import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// 賽季起始時間（2025 Q3 = 7/1）
const SEASON_START = Math.floor(new Date('2025-07-01T00:00:00Z').getTime() / 1000)

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

async function fetchAllActivities(accessToken: string): Promise<any[]> {
  const all: any[] = []
  let page = 1

  while (true) {
    const res = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?after=${SEASON_START}&per_page=200&page=${page}`,
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

  const { data: tokens, error: tokensErr } = await supabase
    .from('runner_tokens')
    .select('*')

  if (tokensErr) {
    return res.status(500).json({ error: tokensErr.message })
  }

  if (!tokens || tokens.length === 0) {
    return res.json({ synced: 0, message: '尚未有跑者連結 Strava' })
  }

  const results = []

  for (const token of tokens) {
    try {
      const accessToken = await getValidAccessToken(token)
      const activities = await fetchAllActivities(accessToken)

      // 只計算跑步活動
      const runs = activities.filter(
        (a) => a.sport_type === 'Run' || a.type === 'Run',
      )

      const distance = Math.round(runs.reduce((s, a) => s + (a.distance ?? 0), 0))
      const elevation = Math.round(runs.reduce((s, a) => s + (a.total_elevation_gain ?? 0), 0))
      const activityCount = runs.length

      await supabase
        .from('runners')
        .update({ distance, elevation, activities: activityCount })
        .eq('id', token.runner_id)

      results.push({ runner_id: token.runner_id, success: true, runs: activityCount })
    } catch (e) {
      results.push({ runner_id: token.runner_id, success: false, error: String(e) })
    }
  }

  res.json({ synced: results.length, results })
}
