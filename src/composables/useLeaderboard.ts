import { ref, computed, onMounted, onUnmounted } from 'vue'
import { api } from '@/lib/api'
import { calcScore } from '@/utils/format'
import type { TeamId } from '@/lib/teams'
import { TEAMS } from '@/lib/teams'
import type { Runner, RankedRunner, Season } from '@/types/runner'

function rankTeam(runners: Runner[], team: TeamId): RankedRunner[] {
  return runners
    .filter(r => r.team === team)
    .map(r => ({ ...r, score: calcScore(r.distance, r.elevation) }))
    .sort((a, b) => b.score - a.score || b.elevation - a.elevation)
    .map((r, i) => ({ ...r, rank: i + 1 }))
}

export function useLeaderboard() {
  const runners = ref<Runner[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)

  const season = ref<Season | null>(null)
  let refreshTimer: number | undefined

  async function fetchRunners() {
    error.value = null

    try {
      const data = await api<{ season: Season; runners: Runner[] }>('/overview')
      if (!Array.isArray(data.runners)) {
        throw new Error('API returned an invalid runner list. Please check /api/overview.')
      }
      runners.value = data.runners
      season.value = data.season
    } catch (err) {
      error.value = err instanceof Error ? err.message : '載入跑者資料失敗'
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    fetchRunners()
    refreshTimer = window.setInterval(fetchRunners, 60_000)
  })
  onUnmounted(() => { window.clearInterval(refreshTimer) })

  const rankedTeamA  = computed<RankedRunner[]>(() => rankTeam(runners.value, 'A'))
  const rankedTeamB  = computed<RankedRunner[]>(() => rankTeam(runners.value, 'B'))
  const teamAScore   = computed(() => rankedTeamA.value.reduce((s, r) => s + r.score, 0))
  const teamBScore   = computed(() => rankedTeamB.value.reduce((s, r) => s + r.score, 0))
  const totalRunners  = computed(() => runners.value.length)
  const totalDistance = computed(() => runners.value.reduce((s, r) => s + r.distance, 0))
  const totalElevation = computed(() => runners.value.reduce((s, r) => s + r.elevation, 0))

  const leadingTeam = computed(() => {
    if (teamAScore.value > teamBScore.value) return TEAMS.A.name
    if (teamBScore.value > teamAScore.value) return TEAMS.B.name
    return '平手'
  })

  const lastSyncedAt = computed<string | null>(() => {
    const times = runners.value
      .map(r => r.synced_at)
      .filter((t): t is string => !!t)
    if (times.length === 0) return null
    return times.sort().at(-1) ?? null
  })

  return {
    loading,
    error,
    season,
    rankedTeamA,
    rankedTeamB,
    teamAScore,
    teamBScore,
    totalRunners,
    totalDistance,
    totalElevation,
    leadingTeam,
    allRunners: runners,
    lastSyncedAt,
    refresh: fetchRunners,
  }
}
