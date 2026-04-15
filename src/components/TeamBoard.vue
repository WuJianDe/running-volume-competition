<script setup lang="ts">
import type { RankedRunner } from '@/types/runner'
import { formatNum } from '@/utils/format'
import RunnerRow from './RunnerRow.vue'

defineProps<{
  runners: RankedRunner[]
  teamName: string
  teamColor: string
  teamScore: number
  fadeDelay: number
}>()
</script>

<template>
  <div :class="`fade-up fade-up-${fadeDelay}`">
    <!-- 隊伍標題列 -->
    <div class="flex items-center gap-2 mb-3 px-3">
      <div class="w-2 h-2 rounded-full" :style="{ background: teamColor }"></div>
      <h3 class="font-semibold text-sm md:text-base" style="color: #111827">{{ teamName }}</h3>
    </div>

    <!-- 欄位標頭 -->
    <div class="header-row grid items-center mb-2 px-3 text-xs font-mono tracking-wider" style="color: #9CA3AF">
      <span>#</span>
      <span>跑者</span>
      <span class="col-desktop text-right">距離</span>
      <span class="col-desktop text-right">爬升</span>
      <span class="text-right">總分</span>
      <span class="text-right">活動</span>
    </div>

    <!-- 跑者列表 -->
    <div class="flex flex-col gap-1.5">
      <RunnerRow
        v-for="(runner, i) in runners"
        :key="runner.id"
        :runner="runner"
        :teamColor="teamColor"
        :animDelay="i + 5"
      />

      <!-- 隊伍總分 -->
      <div class="total-row grid items-center rounded-lg px-2.5 py-3 mt-1" style="border-top: 1px solid #E5E7EB">
        <div></div>
        <span class="text-xs font-mono tracking-wider" style="color: #9CA3AF">隊伍總分</span>
        <div class="col-desktop"></div>
        <div class="col-desktop"></div>
        <div class="text-right font-mono text-sm font-bold" :style="{ color: teamColor }">
          {{ formatNum(teamScore) }}
        </div>
        <div></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header-row,
.total-row {
  grid-template-columns: 40px 1fr 68px 52px;
}
@media (min-width: 768px) {
  .header-row,
  .total-row {
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
