<script setup lang="ts">
import { ref } from 'vue'
import { RefreshCw } from 'lucide-vue-next'

const emit = defineEmits<{ synced: [] }>()

const syncing = ref(false)
const message = ref<{ text: string; ok: boolean } | null>(null)

async function sync() {
  syncing.value = true
  message.value = null
  try {
    const res = await fetch('/api/strava/sync', { method: 'POST' })
    const data = await res.json()
    message.value = {
      text: data.synced > 0 ? `已同步 ${data.synced} 位跑者` : (data.message ?? '尚未有跑者連結 Strava'),
      ok: true,
    }
    emit('synced')
  } catch {
    message.value = { text: '同步失敗，請稍後再試', ok: false }
  } finally {
    syncing.value = false
  }
}
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <button
      @click="sync"
      :disabled="syncing"
      class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono tracking-widest transition-opacity"
      :style="
        syncing
          ? 'background:rgba(245,158,11,.05);color:#525252;border:1px solid rgba(255,255,255,.06);cursor:not-allowed;opacity:.6'
          : 'background:rgba(245,158,11,.1);color:#FBBF24;border:1px solid rgba(245,158,11,.2);cursor:pointer'
      "
    >
      <RefreshCw :size="13" :class="{ 'animate-spin': syncing }" />
      {{ syncing ? '同步中...' : '同步 Strava 資料' }}
    </button>
    <p
      v-if="message"
      class="text-xs font-mono"
      :style="{ color: message.ok ? '#4ADE80' : '#EF4444' }"
    >
      {{ message.text }}
    </p>
  </div>
</template>
