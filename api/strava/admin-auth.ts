import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  const appUrl = (process.env.APP_URL ?? '').replace(/\/$/, '')

  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: `${appUrl}/api/strava/admin-callback`,
    response_type: 'code',
    scope: 'read,activity:read_all',
    approval_prompt: 'force',
    state: 'admin',
  })

  res.redirect(`https://www.strava.com/oauth/authorize?${params}`)
}
