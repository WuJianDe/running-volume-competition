<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { formatKm } from '@/utils/format'

interface FeedItem {
  id: number
  name: string
  distance: number
  elevation: number
  start_date: string
  runner: {
    id: string
    name: string
    avatar: string
    team: 'A' | 'B'
  }
}

interface ActivityRow {
  id: number
  name: string
  distance: number
  elevation: number
  start_date: string
  runners:
    | {
        id: string
        name: string
        avatar: string
        team: 'A' | 'B'
      }
    | {
        id: string
        name: string
        avatar: string
        team: 'A' | 'B'
      }[]
    | null
}

const items   = ref<FeedItem[]>([])
const loading = ref(true)
const error = ref('')

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 3600)  return `${Math.floor(diff / 60)} 分鐘前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小時前`
  return `${Math.floor(diff / 86400)} 天前`
}

const teamColor = (t: 'A' | 'B') => t === 'A' ? '#EC4899' : '#3B82F6'

onMounted(async () => {
  const { data, error: fetchError } = await supabase
    .from('activities')
    .select('id, name, distance, elevation, start_date, runners(id, name, avatar, team)')
    .order('start_date', { ascending: false })
    .limit(5)

  if (fetchError) {
    error.value = fetchError.code === 'PGRST205'
      ? '活動資料表尚未建立，請先執行 Supabase migration'
      : `最近活動載入失敗：${fetchError.message}`
  } else {
    items.value = ((data ?? []) as ActivityRow[])
      .map((item) => {
        const runner = Array.isArray(item.runners) ? item.runners[0] : item.runners
        if (!runner) return null

        return {
          id: item.id,
          name: item.name,
          distance: item.distance,
          elevation: item.elevation,
          start_date: item.start_date,
          runner,
        }
      })
      .filter((item): item is FeedItem => item !== null)
  }

  loading.value = false
})
</script>

<template>
  <section class="max-w-5xl mx-auto px-5 pb-8 fade-up fade-up-7">
    <h2 class="text-sm font-semibold mb-3" style="color: #6B7280">最近活動</h2>

    <div v-if="loading" class="text-xs font-mono text-center py-6 animate-pulse" style="color: #9CA3AF">
      載入中...
    </div>

    <div v-else-if="error" class="text-xs font-mono text-center py-6" style="color: #EF4444">
      {{ error }}
    </div>

    <div v-else-if="items.length === 0" class="text-xs font-mono text-center py-6" style="color: #D1D5DB">
      同步後活動紀錄將顯示在此
    </div>

    <div v-else class="flex flex-col gap-2">
      <div
        v-for="item in items"
        :key="item.id"
        class="flex items-center gap-3 px-4 py-3 rounded-lg"
        style="background: #FFFFFF; border: 1px solid #E5E7EB"
      >
        <span class="text-xl shrink-0">{{ item.runner.avatar || '🏃' }}</span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5">
            <span class="text-sm font-semibold truncate" style="color: #111827">{{ item.runner.name }}</span>
            <span
              class="shrink-0 text-xs px-1.5 py-0.5 rounded-full font-mono"
              :style="`background: ${teamColor(item.runner.team)}18; color: ${teamColor(item.runner.team)}`"
            >{{ item.runner.team === 'A' ? '紅' : '藍' }}</span>
          </div>
          <p class="text-xs truncate mt-0.5" style="color: #9CA3AF">{{ item.name || '跑步' }}</p>
        </div>
        <div class="text-right shrink-0">
          <p class="text-sm font-mono font-semibold" style="color: #111827">{{ formatKm(item.distance) }}</p>
          <p class="text-xs font-mono" style="color: #9CA3AF">{{ timeAgo(item.start_date) }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
