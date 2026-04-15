<script setup lang="ts">
import { formatNum, formatKm } from '@/utils/format'

defineProps<{
  totalRunners: number
  totalDistance: number  // 公尺
  totalElevation: number // 公尺
  leadingTeam: string
}>()
</script>

<template>
  <section class="max-w-5xl mx-auto px-5 -mt-4 mb-8">
    <div class="grid grid-cols-2 gap-3 fade-up fade-up-3 md:grid-cols-4">
      <!-- 跑者數 -->
      <div
        class="stat-pill rounded-xl px-4 py-4 text-center"
        style="background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06)"
      >
        <p class="font-mono text-2xl md:text-3xl font-bold" style="color: #FBBF24">
          {{ totalRunners }}
        </p>
        <p class="text-xs mt-1 tracking-wide" style="color: #525252">跑者</p>
      </div>

      <!-- 總公里數 -->
      <div
        class="stat-pill rounded-xl px-4 py-4 text-center"
        style="background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06)"
      >
        <p class="font-mono text-2xl md:text-3xl font-bold" style="color: #FBBF24">
          {{ formatKm(totalDistance) }}
        </p>
        <p class="text-xs mt-1 tracking-wide" style="color: #525252">總公里數</p>
      </div>

      <!-- 總爬升 -->
      <div
        class="stat-pill rounded-xl px-4 py-4 text-center"
        style="background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06)"
      >
        <p class="font-mono text-2xl md:text-3xl font-bold" style="color: #FBBF24">
          {{ formatNum(totalElevation) }}
        </p>
        <p class="text-xs mt-1 tracking-wide" style="color: #525252">總爬升 m</p>
      </div>

      <!-- 領先隊伍 -->
      <div
        class="stat-pill rounded-xl px-4 py-4 text-center"
        style="background: rgba(245,158,11,.1); border: 1px solid rgba(245,158,11,.15)"
      >
        <p class="font-mono text-xs tracking-widest" style="color: #FBBF24">團隊領先</p>
        <p class="font-mono text-lg md:text-xl font-bold mt-2" style="color: #FBBF24">
          {{ leadingTeam }}
        </p>
      </div>
    </div>
  </section>
</template>
