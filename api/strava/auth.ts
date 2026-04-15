import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  const runnerId = req.query.runner_id as string

  if (!runnerId) {
    return res.status(400).json({ error: 'Missing runner_id' })
  }

  const appUrl = (process.env.APP_URL ?? '').replace(/\/$/, '')

  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: `${appUrl}/api/strava/callback`,
    response_type: 'code',
    scope: 'activity:read_all',
    approval_prompt: 'auto',
    state: runnerId,
  })

  res.redirect(`https://www.strava.com/oauth/authorize?${params}`)
}
