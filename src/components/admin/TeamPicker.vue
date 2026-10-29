<script setup lang="ts">
import { TEAM_IDS, TEAMS } from '@/lib/teams'
import type { TeamId } from '@/lib/teams'

const team = defineModel<TeamId>({ required: true })
</script>

<template>
  <div class="flex gap-2">
    <label
      v-for="t in TEAM_IDS"
      :key="t"
      class="flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer text-sm font-semibold border transition-all"
      :style="team === t
        ? { background: `${TEAMS[t].color}18`, borderColor: `${TEAMS[t].color}55`, color: TEAMS[t].color }
        : { background: '#F9FAFB', borderColor: '#E5E7EB', color: '#9CA3AF' }"
    >
      <input v-model="team" type="radio" :value="t" class="hidden" />
      <span class="w-2 h-2 rounded-full" :style="{ background: team === t ? TEAMS[t].color : '#D1D5DB' }"></span>
      {{ TEAMS[t].name }}
    </label>
  </div>
</template>
