export interface Runner {
  id: string
  name: string
  avatar: string
  distance: number   // 單位：公尺
  elevation: number  // 單位：公尺
  activities: number // 活動次數
  team: 'A' | 'B'
  synced_at: string | null
}

export interface RankedRunner extends Runner {
  score: number
  rank: number
}
