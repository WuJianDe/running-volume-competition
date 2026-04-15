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
      class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-95"
      :style="syncing
        ? 'background: #1C1C1C; color: #525252; border: 1px solid #2A2A2A; cursor: not-allowed'
        : 'background: #1F1A0E; color: #FBBF24; border: 1px solid #3D2E0A; cursor: pointer'"
    >
      <RefreshCw
        :size="14"
        :class="syncing ? 'animate-spin' : ''"
        class="shrink-0"
      />
      {{ syncing ? '同步中...' : '同步 Strava 資料' }}
    </button>

    <!-- 狀態訊息 -->
    <Transition name="fade-msg">
      <p
        v-if="message"
        class="text-xs font-mono"
        :style="{ color: message.ok ? '#4ADE80' : '#EF4444' }"
      >
        {{ message.ok ? '✓' : '✕' }} {{ message.text }}
      </p>
    </Transition>
  </div>
</template>

<style scoped>
.fade-msg-enter-active,
.fade-msg-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}
.fade-msg-enter-from,
.fade-msg-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
