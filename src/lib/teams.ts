export type TeamId = 'A' | 'B'

export const TEAMS: Record<TeamId, { name: string; color: string }> = {
  A: { name: '紅隊', color: '#EC4899' },
  B: { name: '藍隊', color: '#3B82F6' },
}

export const TEAM_IDS: TeamId[] = ['A', 'B']
