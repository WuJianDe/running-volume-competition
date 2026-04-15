<script setup lang="ts">
import { computed } from 'vue'
import type { RankedRunner } from '@/types/runner'
import { formatKm, formatNum } from '@/utils/format'

const props = defineProps<{
  runner: RankedRunner
  teamColor: string
  animDelay: number
}>()

const badgeStyle = computed(() => {
  const base = { width: '32px', height: '32px', fontSize: '12px' }
  if (props.runner.rank <= 3) {
    const bgColors = [props.teamColor, '#A3A3A3', '#B45309']
    return { ...base, background: bgColors[props.runner.rank - 1], color: '#0A0A0A', border: 'none' }
  }
  return { ...base, background: 'transparent', color: '#9CA3AF', border: '1px solid #E5E7EB' }
})

const nameColor = computed(() => (props.runner.rank === 1 ? props.teamColor : '#111827'))
</script>

<template>
  <div
    :class="`grid items-center rounded-lg px-2.5 py-2.5 row-hover fade-up fade-up-${Math.min(animDelay, 8)}`"
    style="
      grid-template-columns: 40px 1fr repeat(4, 68px);
      border: 1px solid #F3F4F6;
      background: #FFFFFF;
    "
  >
    <!-- 名次徽章 -->
    <div class="rank-badge" :style="badgeStyle">{{ runner.rank }}</div>

    <!-- 跑者名稱 -->
    <div class="flex items-center gap-2">
      <span class="text-lg">{{ runner.avatar }}</span>
      <span class="font-semibold text-xs md:text-sm" :style="{ color: nameColor }">
        {{ runner.name }}
      </span>
    </div>

    <!-- 距離 (km) -->
    <div class="text-right font-mono text-xs" style="color: #6B7280">
      {{ formatKm(runner.distance) }}
    </div>

    <!-- 爬升 (m) -->
    <div class="text-right font-mono text-xs" style="color: #6B7280">
      {{ formatNum(runner.elevation) }}
    </div>

    <!-- 總分 -->
    <div class="text-right font-mono text-xs font-bold" :style="{ color: nameColor }">
      {{ formatNum(runner.score) }}
    </div>

    <!-- 活動數量 -->
    <div class="text-right font-mono text-xs" style="color: #6B7280">
      {{ runner.activities }}
    </div>
  </div>
</template>
