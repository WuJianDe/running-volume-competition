<script setup lang="ts">
const props = defineProps<{
  seasonStart: string  // "2026-04-01"
  seasonEnd: string    // "2026-04-30"
}>()

function formatDate(d: string) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${y}/${m}/${day}`
}
</script>

<template>
  <header
    class="relative w-full overflow-hidden"
    style="background: linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 50%, #0A0A0A 100%)"
  >
    <!-- 背景光暈 -->
    <div
      class="absolute inset-0"
      style="background: radial-gradient(ellipse at 50% 0%, rgba(245,158,11,.06) 0%, transparent 60%)"
    ></div>

    <div class="relative max-w-5xl mx-auto px-5 py-12 md:py-16 text-center">
      <!-- 主標題 -->
      <h1
        class="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-4 fade-up fade-up-1"
        style="color: #F5F5F5"
      >
        RUNNING<br />
        <span class="shimmer-gold">LEAGUE</span>
      </h1>

      <!-- 副標題 -->
      <p
        class="text-base md:text-lg font-light max-w-md mx-auto fade-up fade-up-2"
        style="color: #737373"
      >
        每季結算 · 用雙腳征服每一公里
      </p>

      <!-- 賽季區間 -->
      <div v-if="props.seasonStart" class="mt-4 fade-up fade-up-3">
        <span
          class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono tracking-widest"
          style="background: rgba(245,158,11,.08); border: 1px solid rgba(245,158,11,.15); color: #FBBF24"
        >
          <span style="color: #FC4C02; font-size: 8px">●</span>
          {{ formatDate(props.seasonStart) }} – {{ formatDate(props.seasonEnd) }}
        </span>
      </div>
    </div>
  </header>
</template>
