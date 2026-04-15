<script setup lang="ts">
const props = defineProps<{
  seasonStart: string
  seasonEnd: string
}>()

function formatDate(d: string) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${y}/${m}/${day}`
}
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

      <!-- 賽季區間 -->
      <div v-if="props.seasonStart" class="mt-4 fade-up fade-up-3">
        <span
          class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono tracking-widest"
          style="background: #FFF7ED; border: 1px solid #FDBA74; color: #EA580C"
        >
          <span style="color: #FC4C02; font-size: 8px">●</span>
          {{ formatDate(props.seasonStart) }} – {{ formatDate(props.seasonEnd) }}
        </span>
      </div>
    </div>
  </header>
</template>
