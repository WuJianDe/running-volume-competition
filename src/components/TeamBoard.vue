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
      <h3 class="font-semibold text-sm md:text-base" style="color: #F5F5F5">{{ teamName }}</h3>
    </div>

    <!-- 欄位標頭 -->
    <div
      class="grid items-center mb-2 px-3 text-xs font-mono tracking-wider"
      style="color: #525252; grid-template-columns: 40px 1fr 80px"
    >
      <span>#</span>
      <span>跑者</span>
      <span class="text-right">分數</span>
    </div>

    <!-- 跑者列表 -->
    <div class="flex flex-col gap-1.5">
      <RunnerRow
        v-for="(runner, i) in runners"
        :key="runner.name"
        :runner="runner"
        :teamColor="teamColor"
        :animDelay="i + 5"
      />

      <!-- 隊伍總分 -->
      <div
        class="grid items-center rounded-lg px-2.5 py-3 mt-1"
        style="
          grid-template-columns: 40px 1fr 80px;
          border-top: 1px solid rgba(255,255,255,.08);
        "
      >
        <div></div>
        <span class="text-xs font-mono tracking-wider" style="color: #525252">隊伍總分</span>
        <div class="text-right font-mono text-sm font-bold" :style="{ color: teamColor }">
          {{ formatNum(teamScore) }}
        </div>
      </div>
    </div>
  </div>
</template>
