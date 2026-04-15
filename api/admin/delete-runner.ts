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

  const { id } = req.body as { id: string }

  if (!id) return res.status(400).json({ error: '缺少 runner id' })

  const { error } = await supabase.from('runners').delete().eq('id', id)

  if (error) return res.status(500).json({ error: error.message })

  res.json({ success: true })
}
