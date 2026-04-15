<script setup lang="ts">
import { Info } from 'lucide-vue-next'
</script>

<template>
  <section class="max-w-5xl mx-auto px-5 mb-6 fade-up fade-up-4">
    <div
      class="flex items-center gap-3 px-4 py-3 rounded-lg"
      style="background: #FFF7ED; border: 1px solid #FED7AA"
    >
      <Info :size="15" style="color: #F97316; flex-shrink: 0" />
      <p class="text-xs" style="color: #6B7280">
        <span class="font-semibold" style="color: #EA580C">計分規則</span>
        — 每跑 1 公里 = 1 分 ｜ 每爬升 100 公尺 = 1 分
      </p>
    </div>
  </section>
</template>
