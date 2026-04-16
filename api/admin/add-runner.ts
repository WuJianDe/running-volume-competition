import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: '密碼錯誤' })
  }

  const { name, avatar, team } = req.body as {
    name: string
    avatar: string
    team: 'A' | 'B'
  }

  if (!name?.trim() || !avatar?.trim() || !['A', 'B'].includes(team)) {
    return res.status(400).json({ error: '缺少必要欄位' })
  }

  const { data, error } = await supabase
    .from('runners')
    .insert({
      name: name.trim(),
      avatar: avatar.trim(),
      team,
      distance: 0,
      elevation: 0,
      activities: 0,
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  res.status(201).json(data)
}
