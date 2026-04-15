<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
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
const unsynced = computed(() => props.runner.synced_at === null)
</script>

<template>
  <div
    :class="`runner-row grid items-center rounded-lg px-2.5 py-2.5 row-hover fade-up fade-up-${Math.min(animDelay, 8)}`"
    style="border: 1px solid #F3F4F6; background: #FFFFFF"
  >
    <!-- 名次徽章 -->
    <div class="rank-badge" :style="badgeStyle">{{ runner.rank }}</div>

    <!-- 跑者名稱 -->
    <div class="flex items-center gap-2 min-w-0">
      <span class="text-lg shrink-0">{{ runner.avatar }}</span>
      <RouterLink
        :to="`/runner/${runner.id}`"
        class="font-semibold text-xs md:text-sm truncate hover:underline underline-offset-2"
        :style="{ color: nameColor }"
      >{{ runner.name }}</RouterLink>
    </div>

    <!-- 距離 (km) — 桌機才顯示 -->
    <div class="col-desktop text-right font-mono text-xs" style="color: #6B7280">
      {{ unsynced ? '—' : formatKm(runner.distance) }}
    </div>

    <!-- 爬升 (m) — 桌機才顯示 -->
    <div class="col-desktop text-right font-mono text-xs" style="color: #6B7280">
      {{ unsynced ? '—' : formatNum(runner.elevation) }}
    </div>

    <!-- 總分 -->
    <div class="text-right font-mono text-xs font-bold" :style="{ color: unsynced ? '#9CA3AF' : nameColor }">
      {{ unsynced ? '—' : formatNum(runner.score) }}
    </div>

    <!-- 活動數量 -->
    <div class="text-right font-mono text-xs" style="color: #6B7280">
      {{ unsynced ? '—' : runner.activities }}
    </div>
  </div>
</template>

<style scoped>
.runner-row {
  grid-template-columns: 40px 1fr 68px 52px;
}
@media (min-width: 768px) {
  .runner-row {
    grid-template-columns: 40px 1fr repeat(4, 68px);
  }
}
.col-desktop {
  display: none;
}
@media (min-width: 768px) {
  .col-desktop {
    display: block;
  }
}
</style>
