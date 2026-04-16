import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // GET：取得目前賽季設定（不需驗證）
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('settings')
      .select('season_start, season_end')
      .eq('id', 1)
      .single()

    if (error) return res.status(500).json({ error: error.message })

    return res.json({
      season_start: data.season_start,
      season_end:   data.season_end,
    })
  }

  // POST：更新賽季設定（需要管理員密碼）
  if (req.method === 'POST') {
    if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: '密碼錯誤' })
    }

    const { season_start, season_end } = req.body as {
      season_start: string
      season_end: string
    }

    if (!season_start || !season_end) {
      return res.status(400).json({ error: '缺少日期欄位' })
    }

    if (new Date(season_start) > new Date(season_end)) {
      return res.status(400).json({ error: '開始日期不能晚於結束日期' })
    }

    const { error } = await supabase
      .from('settings')
      .update({ season_start, season_end })
      .eq('id', 1)

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true, season_start, season_end })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
