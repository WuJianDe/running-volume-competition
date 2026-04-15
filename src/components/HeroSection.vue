<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  seasonStart: string
  seasonEnd: string
}>()

function formatDate(d: string) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${y}/${m}/${day}`
}

const seasonProgress = computed(() => {
  if (!props.seasonStart || !props.seasonEnd) return null
  const start = new Date(props.seasonStart + 'T00:00:00Z').getTime()
  const end   = new Date(props.seasonEnd   + 'T23:59:59Z').getTime()
  const now   = Date.now()
  if (now <= start) return { pct: 0, day: 0, total: Math.ceil((end - start) / 86400000) }
  if (now >= end)   return { pct: 100, day: Math.ceil((end - start) / 86400000), total: Math.ceil((end - start) / 86400000) }
  const day   = Math.ceil((now - start) / 86400000)
  const total = Math.ceil((end - start) / 86400000)
  return { pct: Math.round((now - start) / (end - start) * 100), day, total }
})
</script>

<template>
  <header class="relative w-full overflow-hidden" style="background: #FFFFFF; border-bottom: 1px solid #E5E7EB">
    <!-- 背景光暈 -->
    <div
      class="absolute inset-0"
      style="background: radial-gradient(ellipse at 50% -10%, rgba(249,115,22,.07) 0%, transparent 65%)"
    ></div>

    <div class="relative max-w-5xl mx-auto px-5 py-12 md:py-16 text-center">
      <!-- 主標題 -->
      <h1
        class="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-3 fade-up fade-up-1"
        style="color: #111827"
      >
        RUNNING<br />
        <span class="shimmer-gold">LEAGUE</span>
      </h1>

      <!-- 副標題 -->
      <p
        class="text-base md:text-lg font-light max-w-md mx-auto fade-up fade-up-2"
        style="color: #9CA3AF"
      >
        每季結算 · 用雙腳征服每一公里
      </p>

      <!-- 賽季區間 + 進度 -->
      <div v-if="props.seasonStart" class="mt-4 fade-up fade-up-3 flex flex-col items-center gap-2">
        <span
          class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono tracking-widest"
          style="background: #FFF7ED; border: 1px solid #FDBA74; color: #EA580C"
        >
          <span style="color: #FC4C02; font-size: 8px">●</span>
          {{ formatDate(props.seasonStart) }} – {{ formatDate(props.seasonEnd) }}
        </span>

        <!-- 進度條 -->
        <div v-if="seasonProgress" class="w-48 flex flex-col items-center gap-1">
          <div class="w-full h-1.5 rounded-full overflow-hidden" style="background: #E5E7EB">
            <div
              class="h-full rounded-full transition-all duration-700"
              style="background: linear-gradient(90deg, #F97316, #FB923C)"
              :style="{ width: seasonProgress.pct + '%' }"
            ></div>
          </div>
          <p class="text-xs font-mono" style="color: #9CA3AF">
            <template v-if="seasonProgress.pct === 0">賽季尚未開始</template>
            <template v-else-if="seasonProgress.pct === 100">賽季已結束</template>
            <template v-else>第 {{ seasonProgress.day }} 天 / 共 {{ seasonProgress.total }} 天</template>
          </p>
        </div>
      </div>
    </div>
  </header>
</template>
