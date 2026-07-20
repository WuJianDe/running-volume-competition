<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { api } from '@/lib/api'
import { calcScore, formatKm, formatNum } from '@/utils/format'
import type { Runner } from '@/types/runner'

interface Activity { id: number; name: string; distance: number; elevation: number; start_date: string }
const route = useRoute()
const router = useRouter()
const runner = ref<Runner | null>(null)
const activities = ref<Activity[]>([])
const seasonStart = ref('')
const error = ref('')
const loading = ref(true)
const teamColor = computed(() => runner.value?.team === 'A' ? '#EC4899' : '#3B82F6')
const score = computed(() => runner.value ? calcScore(runner.value.distance, runner.value.elevation) : 0)

const weeks = computed(() => {
  if (!seasonStart.value) return [] as Array<{ label: string; km: number }>
  const start = new Date(`${seasonStart.value}T00:00:00Z`).getTime()
  const values = new Map<number, number>()
  for (const activity of activities.value) {
    const week = Math.max(0, Math.floor((new Date(activity.start_date).getTime() - start) / 604800000))
    values.set(week, (values.get(week) ?? 0) + activity.distance / 1000)
  }
  return [...values.entries()].sort(([a], [b]) => a - b).map(([week, km]) => {
    const date = new Date(start + week * 604800000)
    return { label: `${date.getMonth() + 1}/${date.getDate()}`, km: Math.round(km * 10) / 10 }
  })
})
const maxKm = computed(() => Math.max(1, ...weeks.value.map(week => week.km)))
function formatDate(value: string) { const date = new Date(value); return `${date.getMonth() + 1}/${date.getDate()}` }

onMounted(async () => {
  const id = route.params.id as string
  try {
    const [runnerData, activityData, season] = await Promise.all([
      api<Runner>(`/runners/${id}`), api<Activity[]>(`/runners/${id}/activities`), api<{ season_start: string }>('/season'),
    ])
    runner.value = runnerData; activities.value = activityData; seasonStart.value = season.season_start
  } catch (err) { error.value = err instanceof Error ? err.message : '載入跑者資料失敗' }
  finally { loading.value = false }
})
</script>

<template>
  <main class="min-h-screen bg-gray-50 px-5 py-8" style="font-family: Outfit, sans-serif">
    <div class="mx-auto max-w-2xl">
      <button @click="router.push('/')" class="mb-6 flex items-center gap-1 text-xs text-gray-400"><ArrowLeft :size="14" /> 返回排行榜</button>
      <p v-if="loading" class="py-20 text-center font-mono text-xs text-gray-400">LOADING...</p>
      <p v-else-if="error" class="py-20 text-center text-sm text-red-500">{{ error }}</p>
      <template v-else-if="runner">
        <header class="mb-8 flex items-center gap-4"><span class="text-5xl">{{ runner.avatar }}</span><div><h1 class="text-2xl font-black">{{ runner.name }}</h1><span class="text-xs" :style="{ color: teamColor }">隊伍 {{ runner.team }}</span></div></header>
        <section class="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div v-for="item in [{ label: '總距離', value: formatKm(runner.distance) + ' km' }, { label: '爬升', value: formatNum(runner.elevation) + ' m' }, { label: '積分', value: formatNum(score) }, { label: '活動', value: String(runner.activities) }]" :key="item.label" class="rounded-xl border border-gray-200 bg-white p-4 text-center"><p class="font-mono text-xl font-bold">{{ item.value }}</p><p class="mt-1 text-xs text-gray-400">{{ item.label }}</p></div>
        </section>
        <section v-if="weeks.length" class="mb-8 rounded-xl border border-gray-200 bg-white p-5"><h2 class="mb-4 text-sm font-semibold text-gray-600">每週距離</h2><div class="flex h-28 items-end gap-2"><div v-for="week in weeks" :key="week.label" class="flex flex-1 flex-col items-center justify-end"><span class="text-xs" :style="{ color: teamColor }">{{ week.km }}</span><div class="mt-1 w-full rounded-t" :style="{ height: `${week.km / maxKm * 80}px`, background: teamColor }" /></div></div><div class="mt-2 flex gap-2"><span v-for="week in weeks" :key="week.label" class="flex-1 text-center text-xs text-gray-400">{{ week.label }}</span></div></section>
        <section><h2 class="mb-3 text-sm font-semibold text-gray-600">活動紀錄（{{ activities.length }}）</h2><p v-if="!activities.length" class="rounded-xl bg-white py-10 text-center text-sm text-gray-400">尚無活動紀錄</p><div v-else class="space-y-2"><article v-for="activity in activities" :key="activity.id" class="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"><div><p class="text-sm font-semibold">{{ activity.name || '跑步活動' }}</p><p class="text-xs text-gray-400">{{ formatDate(activity.start_date) }}</p></div><div class="text-right font-mono text-sm"><p>{{ formatKm(activity.distance) }} km</p><p class="text-xs text-gray-400">{{ formatNum(activity.elevation) }} m</p></div></article></div></section>
      </template>
    </div>
  </main>
</template>
