import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, error: stravaError } = req.query
  const appUrl = (process.env.APP_URL ?? '').replace(/\/$/, '')

  if (stravaError) {
    return res.redirect(`${appUrl}/admin?strava=denied`)
  }

  if (!code) {
    return res.status(400).send('Missing code')
  }

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
    return res.redirect(`${appUrl}/admin?strava=error`)
  }

  const token = await tokenRes.json()

  const { error: dbError } = await supabase
    .from('settings')
    .update({
      strava_access_token: token.access_token,
      strava_refresh_token: token.refresh_token,
      strava_expires_at: token.expires_at,
    })
    .eq('id', 1)

  if (dbError) {
    return res.redirect(`${appUrl}/admin?strava=error`)
  }

  res.redirect(`${appUrl}/admin?strava=connected`)
}
