import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state: runnerId, error: stravaError } = req.query

  const appUrl = (process.env.APP_URL ?? '').replace(/\/$/, '')

  if (stravaError) {
    return res.redirect(`${appUrl}/?connect=${runnerId}&error=denied`)
  }

  if (!code || !runnerId) {
    return res.status(400).send('Missing code or state')
  }

  // 用 code 換取 access_token
  const tokenRes = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return res.status(400).send('Strava token exchange failed')
  }

  const token = await tokenRes.json()

  // 存入 Supabase
  const { error: dbError } = await supabase
    .from('runner_tokens')
    .upsert(
      {
        runner_id: runnerId,
        athlete_id: token.athlete.id,
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        expires_at: token.expires_at,
      },
      { onConflict: 'runner_id' },
    )

  if (dbError) {
    return res.status(500).send(`DB error: ${dbError.message}`)
  }

  res.redirect(`${appUrl}/?connected=true`)
}
