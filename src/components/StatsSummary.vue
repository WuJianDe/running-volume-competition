<script setup lang="ts">
import { formatNum, formatKm } from '@/utils/format'

defineProps<{
  totalRunners: number
  totalDistance: number
  totalElevation: number
  leadingTeam: string
}>()
</script>

<template>
  <section class="max-w-5xl mx-auto px-5 py-6 mb-2">
    <div class="grid grid-cols-2 gap-3 fade-up fade-up-3 md:grid-cols-4">
      <!-- 跑者數 -->
      <div
        class="stat-pill rounded-xl px-4 py-4 text-center"
        style="background: #FFFFFF; border: 1px solid #E5E7EB"
      >
        <p class="font-mono text-2xl md:text-3xl font-bold" style="color: #111827">
          {{ totalRunners }}
        </p>
        <p class="text-xs mt-1 tracking-wide" style="color: #9CA3AF">跑者</p>
      </div>

      <!-- 總公里數 -->
      <div
        class="stat-pill rounded-xl px-4 py-4 text-center"
        style="background: #FFFFFF; border: 1px solid #E5E7EB"
      >
        <p class="font-mono text-2xl md:text-3xl font-bold" style="color: #111827">
          {{ formatKm(totalDistance) }}
        </p>
        <p class="text-xs mt-1 tracking-wide" style="color: #9CA3AF">總公里數</p>
      </div>

      <!-- 總爬升 -->
      <div
        class="stat-pill rounded-xl px-4 py-4 text-center"
        style="background: #FFFFFF; border: 1px solid #E5E7EB"
      >
        <p class="font-mono text-2xl md:text-3xl font-bold" style="color: #111827">
          {{ formatNum(totalElevation) }}
        </p>
        <p class="text-xs mt-1 tracking-wide" style="color: #9CA3AF">總爬升 m</p>
      </div>

      <!-- 領先隊伍 -->
      <div
        class="stat-pill rounded-xl px-4 py-4 text-center"
        style="background: #FFF7ED; border: 1px solid #FDBA74"
      >
        <p class="font-mono text-xs tracking-widest" style="color: #F97316">團隊領先</p>
        <p class="font-mono text-lg md:text-xl font-bold mt-2" style="color: #EA580C">
          {{ leadingTeam }}
        </p>
      </div>
    </div>
  </section>
</template>
