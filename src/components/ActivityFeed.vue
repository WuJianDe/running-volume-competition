<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/lib/api'
import { formatKm } from '@/utils/format'

interface Activity { id: number; name: string; distance: number; start_date: string; runner_name: string; runner_avatar: string; runner_team: 'A' | 'B' }
const items = ref<Activity[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try { items.value = await api<Activity[]>('/activities') }
  catch (err) { error.value = err instanceof Error ? err.message : '無法載入活動紀錄' }
  finally { loading.value = false }
})
</script>

<template>
  <section class="mx-auto max-w-5xl px-5 pb-8">
    <h2 class="mb-3 text-sm font-semibold text-gray-600">最近活動</h2>
    <p v-if="loading" class="py-6 text-center text-xs text-gray-400">載入中…</p>
    <p v-else-if="error" class="py-6 text-center text-xs text-red-500">{{ error }}</p>
    <div v-else class="space-y-2"><article v-for="item in items" :key="item.id" class="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3"><span class="text-xl">{{ item.runner_avatar }}</span><div class="min-w-0 flex-1"><p class="truncate text-sm font-semibold">{{ item.runner_name }}</p><p class="truncate text-xs text-gray-400">{{ item.name || '跑步活動' }}</p></div><p class="font-mono text-sm">{{ formatKm(item.distance) }} km</p></article></div>
  </section>
</template>
