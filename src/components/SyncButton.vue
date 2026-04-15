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
      class="group relative inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-xs font-mono tracking-widest transition-all duration-200"
      :style="syncing
        ? 'background: rgba(245,158,11,.04); color: #525252; border: 1px solid rgba(255,255,255,.06); cursor: not-allowed'
        : 'background: rgba(245,158,11,.08); color: #FBBF24; border: 1px solid rgba(245,158,11,.18); cursor: pointer; box-shadow: 0 0 0 0 rgba(245,158,11,0)'"
      @mouseenter="(e: MouseEvent) => { if (!syncing) (e.currentTarget as HTMLElement).style.boxShadow = '0 0 16px rgba(245,158,11,.15)' }"
      @mouseleave="(e: MouseEvent) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 0 rgba(245,158,11,0)' }"
    >
      <!-- Strava 圓點 -->
      <span
        class="w-1.5 h-1.5 rounded-full shrink-0"
        :style="syncing ? 'background:#525252' : 'background:#FC4C02'"
      ></span>

      <RefreshCw
        :size="11"
        :class="syncing ? 'animate-spin' : ''"
        class="shrink-0"
      />

      <span>{{ syncing ? 'SYNCING...' : 'SYNC STRAVA' }}</span>
    </button>

    <!-- 狀態訊息 -->
    <Transition name="fade-msg">
      <p
        v-if="message"
        class="text-xs font-mono tracking-wide"
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
  transition: opacity 0.3s, transform 0.3s;
}
.fade-msg-enter-from,
.fade-msg-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
