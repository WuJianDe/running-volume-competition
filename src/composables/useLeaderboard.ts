import { computed } from 'vue'
import { runners } from '@/data/runners'
import { calcScore } from '@/utils/format'
import type { RankedRunner } from '@/types/runner'

function rankTeam(team: 'A' | 'B'): RankedRunner[] {
  return runners
    .filter(r => r.team === team)
    .map(r => ({ ...r, score: calcScore(r.distance, r.elevation) }))
    .sort((a, b) => b.score - a.score)
    .map((r, i) => ({ ...r, rank: i + 1 }))
}

export function useLeaderboard() {
  const rankedTeamA = computed<RankedRunner[]>(() => rankTeam('A'))
  const rankedTeamB = computed<RankedRunner[]>(() => rankTeam('B'))

  const teamAScore = computed(() => rankedTeamA.value.reduce((s, r) => s + r.score, 0))
  const teamBScore = computed(() => rankedTeamB.value.reduce((s, r) => s + r.score, 0))

  const totalRunners  = computed(() => runners.length)
  const totalDistance = computed(() => runners.reduce((s, r) => s + r.distance, 0))
  const totalElevation = computed(() => runners.reduce((s, r) => s + r.elevation, 0))

  const leadingTeam = computed(() => {
    if (teamAScore.value > teamBScore.value) return '紅隊'
    if (teamBScore.value > teamAScore.value) return '藍隊'
    return '平手'
  })

  return {
    rankedTeamA,
    rankedTeamB,
    teamAScore,
    teamBScore,
    totalRunners,
    totalDistance,
    totalElevation,
    leadingTeam,
  }
}
