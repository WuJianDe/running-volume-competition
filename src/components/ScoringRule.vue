<script setup lang="ts">
import { Info } from 'lucide-vue-next'
</script>

<template>
  <section class="max-w-5xl mx-auto px-5 mb-6 fade-up fade-up-4">
    <div
      class="flex items-center gap-3 px-4 py-3 rounded-lg"
      style="background: rgba(245,158,11,.04); border: 1px solid rgba(245,158,11,.08)"
    >
      <Info :size="16" style="color: #FBBF24; flex-shrink: 0" />
      <p class="text-xs" style="color: #A3A3A3">
        <span class="font-medium" style="color: #FBBF24">計分規則</span>
        — 每跑 1 公里 = 1 分 ｜ 每爬升 100 公尺 = 1 分
      </p>
    </div>
  </section>
</template>
