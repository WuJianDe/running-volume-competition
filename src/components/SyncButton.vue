<script setup lang="ts">
import { ref, computed } from 'vue'
import { RefreshCw } from 'lucide-vue-next'

const props = defineProps<{ lastSyncedAt: string | null }>()
const emit = defineEmits<{ synced: [] }>()

const syncing = ref(false)
const message = ref<{ text: string; ok: boolean } | null>(null)

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return '剛剛更新'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分鐘前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小時前`
  return `${Math.floor(diff / 86400)} 天前`
}

const lastSyncLabel = computed(() => timeAgo(props.lastSyncedAt))

async function sync() {
  syncing.value = true
  message.value = null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const res = await fetch('/api/strava/sync', { method: 'POST', signal: controller.signal })
    clearTimeout(timeout)
    const data = await res.json()
    if (!res.ok) {
      message.value = { text: data.error ?? '同步失敗', ok: false }
    } else {
      message.value = {
        text: data.synced > 0 ? `已同步 ${data.synced} 位跑者` : (data.message ?? '本季尚無跑步資料'),
        ok: true,
      }
      emit('synced')
    }
  } catch (e: unknown) {
    clearTimeout(timeout)
    const isAbort = e instanceof DOMException && e.name === 'AbortError'
    message.value = { text: isAbort ? '同步逾時，請稍後再試' : '同步失敗，請稍後再試', ok: false }
  } finally {
    syncing.value = false
  }
}
</script>

<template>
  <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">

    <!-- 狀態訊息 -->
    <Transition name="fade-msg">
      <div
        v-if="message"
        class="px-3 py-1.5 rounded-lg text-xs font-mono"
        :style="message.ok
          ? 'background: #F0FDF4; color: #16A34A; border: 1px solid #BBF7D0'
          : 'background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA'"
      >
        {{ message.ok ? '✓' : '✕' }} {{ message.text }}
      </div>
    </Transition>

    <!-- 按鈕 -->
    <div class="flex flex-col items-end gap-1">
      <button
        @click="sync"
        :disabled="syncing"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-95"
        style="box-shadow: 0 2px 12px rgba(0,0,0,.08)"
        :style="syncing
          ? 'background: #F3F4F6; color: #9CA3AF; border: 1px solid #E5E7EB; cursor: not-allowed'
          : 'background: #FFF7ED; color: #EA580C; border: 1px solid #FDBA74; cursor: pointer'"
      >
        <RefreshCw :size="14" :class="syncing ? 'animate-spin' : ''" class="shrink-0" />
        {{ syncing ? '更新中...' : '更新數據' }}
      </button>
      <span v-if="lastSyncLabel && !syncing" class="text-xs font-mono" style="color: #9CA3AF">
        {{ lastSyncLabel }}
      </span>
    </div>

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
  transform: translateY(6px);
}
</style>
