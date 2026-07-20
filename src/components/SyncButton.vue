<script setup lang="ts">
import { computed, ref } from 'vue'
import { RefreshCw } from 'lucide-vue-next'
import { adminHeaders, api } from '@/lib/api'

const props = defineProps<{ lastSyncedAt: string | null }>()
const emit = defineEmits<{ synced: [] }>()
const syncing = ref(false)
const message = ref('')
const lastSyncLabel = computed(() => props.lastSyncedAt ? new Date(props.lastSyncedAt).toLocaleString('zh-TW') : '')

async function sync() {
  const secret = window.prompt('請輸入管理密鑰以同步 Strava')
  if (!secret) return
  syncing.value = true; message.value = ''
  try {
    const result = await api<{ synced: number }>('/admin/sync', { method: 'POST', headers: adminHeaders(secret) })
    message.value = `已同步 ${result.synced} 位跑者`; emit('synced')
  } catch (err) { message.value = err instanceof Error ? err.message : '同步失敗' }
  finally { syncing.value = false }
}
</script>

<template>
  <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2"><p v-if="message" class="rounded bg-white px-3 py-2 text-xs shadow">{{ message }}</p><span v-if="lastSyncLabel" class="text-xs text-gray-400">上次同步：{{ lastSyncLabel }}</span><button @click="sync" :disabled="syncing" class="inline-flex items-center gap-2 rounded-lg border border-orange-300 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-600"><RefreshCw :size="14" :class="syncing ? 'animate-spin' : ''" />{{ syncing ? '同步中…' : '同步 Strava' }}</button></div>
</template>
