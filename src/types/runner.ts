import type { TeamId } from '@/lib/teams'

export interface Runner {
  id: string
  name: string
  avatar: string
  distance: number   // 單位：公尺
  elevation: number  // 單位：公尺
  activities: number // 活動次數
  team: TeamId
  synced_at: string | null
}

export interface AdminRunner extends Runner {
  connect_token: string
  strava_connected: boolean
}

export interface Season {
  season_start: string
  season_end: string
}

export interface RankedRunner extends Runner {
  score: number
  rank: number
}
