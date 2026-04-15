<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { supabase } from '@/lib/supabase'
import { formatKm, formatNum, calcScore } from '@/utils/format'

interface Activity {
  id: number
  name: string
  distance: number
  elevation: number
  start_date: string
}

interface Runner {
  id: string
  name: string
  avatar: string
  team: 'A' | 'B'
  distance: number
  elevation: number
  activities: number
  synced_at: string | null
}

const route  = useRoute()
const router = useRouter()
const id     = route.params.id as string

const runner     = ref<Runner | null>(null)
const activities = ref<Activity[]>([])
const loading    = ref(true)
const seasonStart = ref('')
const activitiesError = ref('')

const teamColor = computed(() => runner.value?.team === 'A' ? '#EC4899' : '#3B82F6')
const teamName  = computed(() => runner.value?.team === 'A' ? '紅隊' : '藍隊')
const score     = computed(() => runner.value ? calcScore(runner.value.distance, runner.value.elevation) : 0)

// ── 週次圖表 ─────────────────────────────────────────────────
interface WeekBar {
  label: string
  km: number
  elev: number
  count: number
}

const weeklyBars = computed((): WeekBar[] => {
  if (!seasonStart.value || activities.value.length === 0) return []
  const origin = new Date(seasonStart.value + 'T00:00:00Z').getTime()
  const map = new Map<number, WeekBar>()

  for (const a of activities.value) {
    const diff  = new Date(a.start_date).getTime() - origin
    const wIdx  = Math.max(0, Math.floor(diff / (7 * 86400000)))
    const wDate = new Date(origin + wIdx * 7 * 86400000)
    const label = `${wDate.getMonth() + 1}/${wDate.getDate()}`
    if (!map.has(wIdx)) map.set(wIdx, { label, km: 0, elev: 0, count: 0 })
    const w = map.get(wIdx)!
    w.km    += a.distance / 1000
    w.elev  += a.elevation
    w.count += 1
  }

  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, w]) => ({ ...w, km: Math.round(w.km * 10) / 10 }))
})

const maxKm = computed(() => Math.max(...weeklyBars.value.map(w => w.km), 1))

function barHeight(km: number) {
  return Math.round((km / maxKm.value) * 80)
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

onMounted(async () => {
  const [runnerRes, activitiesRes, seasonRes] = await Promise.all([
    supabase.from('runners').select('*').eq('id', id).single(),
    supabase.from('activities').select('*').eq('runner_id', id).order('start_date', { ascending: false }),
    fetch('/api/admin/season'),
  ])

  if (runnerRes.data) runner.value = runnerRes.data as Runner
  if (activitiesRes.data) activities.value = activitiesRes.data as Activity[]
  if (activitiesRes.error) {
    activitiesError.value = activitiesRes.error.code === 'PGRST205'
      ? '活動資料表尚未建立，請先執行 Supabase migration'
      : `活動資料載入失敗：${activitiesRes.error.message}`
  }
  if (seasonRes.ok) {
    const s = await seasonRes.json()
    seasonStart.value = s.season_start
  }
  loading.value = false
})
</script>

<template>
  <div class="min-h-screen w-full" style="background: #F9FAFB; color: #111827; font-family: 'Outfit', sans-serif">

    <!-- Loading -->
    <div v-if="loading" class="min-h-screen flex items-center justify-center">
      <p class="font-mono text-xs animate-pulse" style="color: #9CA3AF">LOADING...</p>
    </div>

    <!-- 找不到跑者 -->
    <div v-else-if="!runner" class="min-h-screen flex flex-col items-center justify-center gap-4">
      <p style="color: #6B7280">找不到此跑者</p>
      <button @click="router.push('/')" class="text-sm" style="color: #F97316">← 返回排行榜</button>
    </div>

    <!-- 主內容 -->
    <template v-else>
      <div class="max-w-2xl mx-auto px-5 py-8">

        <!-- 返回 -->
        <button
          @click="router.push('/')"
          class="flex items-center gap-1.5 text-xs font-mono mb-6 transition-opacity hover:opacity-60"
          style="color: #9CA3AF"
        >
          <ArrowLeft :size="13" /> 返回排行榜
        </button>

        <!-- 跑者資訊 -->
        <div class="flex items-center gap-4 mb-8">
          <span class="text-5xl">{{ runner.avatar }}</span>
          <div>
            <h1 class="text-2xl font-black" style="color: #111827">{{ runner.name }}</h1>
            <span
              class="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
              :style="`background: ${teamColor}18; color: ${teamColor}; border: 1px solid ${teamColor}44`"
            >{{ teamName }}</span>
          </div>
        </div>

        <!-- 統計 4 格 -->
        <div class="grid grid-cols-2 gap-3 mb-8 md:grid-cols-4">
          <div class="rounded-xl px-4 py-4 text-center" style="background: #FFFFFF; border: 1px solid #E5E7EB">
            <p class="font-mono text-2xl font-bold" style="color: #111827">{{ formatKm(runner.distance) }}</p>
            <p class="text-xs mt-1" style="color: #9CA3AF">距離</p>
          </div>
          <div class="rounded-xl px-4 py-4 text-center" style="background: #FFFFFF; border: 1px solid #E5E7EB">
            <p class="font-mono text-2xl font-bold" style="color: #111827">{{ formatNum(runner.elevation) }}</p>
            <p class="text-xs mt-1" style="color: #9CA3AF">爬升 m</p>
          </div>
          <div class="rounded-xl px-4 py-4 text-center" :style="`background: ${teamColor}0d; border: 1px solid ${teamColor}33`">
            <p class="font-mono text-2xl font-bold" :style="{ color: teamColor }">{{ formatNum(score) }}</p>
            <p class="text-xs mt-1" style="color: #9CA3AF">總分</p>
          </div>
          <div class="rounded-xl px-4 py-4 text-center" style="background: #FFFFFF; border: 1px solid #E5E7EB">
            <p class="font-mono text-2xl font-bold" style="color: #111827">{{ runner.activities }}</p>
            <p class="text-xs mt-1" style="color: #9CA3AF">活動</p>
          </div>
        </div>

        <!-- 週次圖表 -->
        <div v-if="weeklyBars.length > 0" class="mb-8 rounded-xl p-5" style="background: #FFFFFF; border: 1px solid #E5E7EB">
          <h2 class="text-sm font-semibold mb-4" style="color: #6B7280">每週里程</h2>
          <div class="flex items-end gap-2" style="height: 90px">
            <div
              v-for="week in weeklyBars"
              :key="week.label"
              class="flex-1 flex flex-col items-center justify-end gap-1"
              style="height: 100%"
            >
              <span class="text-xs font-mono" :style="{ color: teamColor }">{{ week.km }}</span>
              <div
                class="w-full rounded-t transition-all duration-700"
                :style="{ height: barHeight(week.km) + 'px', background: teamColor, opacity: '0.8', minHeight: week.km > 0 ? '3px' : '0' }"
              ></div>
            </div>
          </div>
          <div class="flex gap-2 mt-2">
            <div
              v-for="week in weeklyBars"
              :key="week.label + '-label'"
              class="flex-1 text-center text-xs font-mono"
              style="color: #9CA3AF"
            >{{ week.label }}</div>
          </div>
        </div>

        <!-- 活動列表 -->
        <div>
          <h2 class="text-sm font-semibold mb-3" style="color: #6B7280">
            本季活動（{{ activities.length }} 筆）
          </h2>

          <div v-if="activitiesError" class="text-center py-10 text-sm" style="color: #EF4444">
            {{ activitiesError }}
          </div>

          <div v-else-if="activities.length === 0" class="text-center py-10 text-sm" style="color: #9CA3AF">
            {{ runner.synced_at ? '本季尚無跑步記錄' : '尚未同步 Strava 資料' }}
          </div>

          <div v-else class="flex flex-col gap-2">
            <div
              v-for="act in activities"
              :key="act.id"
              class="flex items-center gap-3 px-4 py-3 rounded-lg"
              style="background: #FFFFFF; border: 1px solid #E5E7EB"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold truncate" style="color: #111827">{{ act.name || '跑步' }}</p>
                <p class="text-xs font-mono mt-0.5" style="color: #9CA3AF">{{ fmtDate(act.start_date) }}</p>
              </div>
              <div class="text-right shrink-0">
                <p class="text-sm font-mono font-semibold" style="color: #111827">{{ formatKm(act.distance) }}</p>
                <p class="text-xs font-mono" style="color: #9CA3AF">↑ {{ formatNum(act.elevation) }} m</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </template>
  </div>
</template>
