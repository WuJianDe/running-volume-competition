import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { calcScore } from '@/utils/format'
import type { Runner, RankedRunner } from '@/types/runner'

function rankTeam(runners: Runner[], team: 'A' | 'B'): RankedRunner[] {
  return runners
    .filter(r => r.team === team)
    .map(r => ({ ...r, score: calcScore(r.distance, r.elevation) }))
    .sort((a, b) => b.score - a.score)
    .map((r, i) => ({ ...r, rank: i + 1 }))
}

export function useLeaderboard() {
  const runners = ref<Runner[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)

  async function fetchRunners() {
    loading.value = true
    error.value = null

    const { data, error: err } = await supabase
      .from('runners')
      .select('id, name, avatar, distance, elevation, activities, team')

    if (err) {
      error.value = err.message
    } else {
      runners.value = (data ?? []) as Runner[]
    }
    loading.value = false
  }

  onMounted(fetchRunners)

  const rankedTeamA  = computed<RankedRunner[]>(() => rankTeam(runners.value, 'A'))
  const rankedTeamB  = computed<RankedRunner[]>(() => rankTeam(runners.value, 'B'))
  const teamAScore   = computed(() => rankedTeamA.value.reduce((s, r) => s + r.score, 0))
  const teamBScore   = computed(() => rankedTeamB.value.reduce((s, r) => s + r.score, 0))
  const totalRunners  = computed(() => runners.value.length)
  const totalDistance = computed(() => runners.value.reduce((s, r) => s + r.distance, 0))
  const totalElevation = computed(() => runners.value.reduce((s, r) => s + r.elevation, 0))

  const leadingTeam = computed(() => {
    if (teamAScore.value > teamBScore.value) return '紅隊'
    if (teamBScore.value > teamAScore.value) return '藍隊'
    return '平手'
  })

  return {
    loading,
    error,
    rankedTeamA,
    rankedTeamB,
    teamAScore,
    teamBScore,
    totalRunners,
    totalDistance,
    totalElevation,
    leadingTeam,
    allRunners: runners,
    refresh: fetchRunners,
  }
}
