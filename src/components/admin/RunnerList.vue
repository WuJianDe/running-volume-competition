<script setup lang="ts">
import { ref } from 'vue'
import { Check, Copy, Pencil, Trash2, X } from 'lucide-vue-next'
import type { RunnerInput } from '@/composables/useAdmin'
import { TEAMS } from '@/lib/teams'
import type { AdminRunner } from '@/types/runner'
import TeamPicker from './TeamPicker.vue'

const props = defineProps<{
  runners: AdminRunner[]
  loading: boolean
  update: (id: string, input: RunnerInput) => Promise<void>
  remove: (id: string) => Promise<void>
}>()

const error = ref('')
const editingId = ref<string | null>(null)
const editForm = ref<RunnerInput>({ name: '', avatar: '', team: 'A' })
const busyId = ref<string | null>(null)
const copiedId = ref<string | null>(null)

function startEdit(runner: AdminRunner) {
  editingId.value = runner.id
  editForm.value = { name: runner.name, avatar: runner.avatar, team: runner.team }
  error.value = ''
}

async function run(id: string, action: () => Promise<void>, failure: string) {
  busyId.value = id
  error.value = ''
  try {
    await action()
  } catch (err) {
    error.value = `${failure}：${err instanceof Error ? err.message : '未知錯誤'}`
  } finally {
    busyId.value = null
  }
}

async function saveEdit(id: string) {
  await run(id, async () => {
    await props.update(id, editForm.value)
    editingId.value = null
  }, '儲存失敗')
}

async function removeRunner(id: string) {
  if (!confirm('確定要刪除這位跑者？')) return
  await run(id, () => props.remove(id), '刪除失敗')
}

function connectUrl(runner: AdminRunner) {
  const url = new URL(import.meta.env.BASE_URL, window.location.origin)
  url.searchParams.set('connect', runner.connect_token)
  return url.toString()
}

async function copyLink(runner: AdminRunner) {
  await navigator.clipboard.writeText(connectUrl(runner))
  copiedId.value = runner.id
  setTimeout(() => { copiedId.value = null }, 2000)
}
</script>

<template>
  <section class="mb-8">
    <p v-if="error" class="text-xs font-mono mb-3 px-3 py-2 rounded-lg text-red-600 bg-red-50 border border-red-200">{{ error }}</p>
    <h2 class="text-sm font-semibold mb-1 text-gray-500">跑者列表（{{ runners.length }} 人）</h2>
    <p class="text-xs font-mono mb-3 text-gray-400">複製專屬連結傳給跑者，讓對方授權 Strava；連結為私人連結，請勿公開。</p>

    <div v-if="loading" class="text-xs font-mono text-center py-8 animate-pulse text-gray-400">載入中...</div>

    <div v-else class="flex flex-col gap-2">
      <template v-for="runner in runners" :key="runner.id">
        <div v-if="editingId !== runner.id" class="flex items-center gap-3 px-4 py-3 rounded-lg bg-white border border-gray-200">
          <span class="text-lg">{{ runner.avatar }}</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-900">{{ runner.name }}</p>
            <p class="text-xs font-mono" :style="{ color: TEAMS[runner.team].color }">
              {{ TEAMS[runner.team].name }} · {{ runner.strava_connected ? 'Strava 已連結' : '尚未連結 Strava' }}
            </p>
          </div>
          <button
            @click="copyLink(runner)"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border hover:opacity-70"
            :class="copiedId === runner.id ? 'bg-green-50 text-green-600 border-green-200' : 'bg-orange-50 text-orange-600 border-orange-300'"
          >
            <Check v-if="copiedId === runner.id" :size="12" /><Copy v-else :size="12" />
            {{ copiedId === runner.id ? '已複製' : '授權連結' }}
          </button>
          <button @click="startEdit(runner)" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono hover:opacity-70 bg-gray-50 text-gray-500 border border-gray-200">
            <Pencil :size="12" /> 編輯
          </button>
          <button @click="removeRunner(runner.id)" :disabled="busyId === runner.id" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono hover:opacity-70 bg-red-50 text-red-600 border border-red-200">
            <Trash2 :size="12" /> {{ busyId === runner.id ? '處理中' : '刪除' }}
          </button>
        </div>

        <div v-else class="flex flex-col gap-3 px-4 py-3 rounded-lg bg-gray-50 border border-orange-300">
          <div class="grid grid-cols-2 gap-2">
            <input v-model="editForm.name" placeholder="姓名" class="rounded-lg px-3 py-1.5 text-sm outline-none bg-white border border-gray-200" />
            <input v-model="editForm.avatar" placeholder="頭像" class="rounded-lg px-3 py-1.5 text-sm outline-none bg-white border border-gray-200" />
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <TeamPicker v-model="editForm.team" />
            <div class="flex-1"></div>
            <button @click="editingId = null" class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono hover:opacity-70 bg-gray-50 text-gray-500 border border-gray-200">
              <X :size="12" /> 取消
            </button>
            <button @click="saveEdit(runner.id)" :disabled="busyId === runner.id" class="px-3 py-1.5 rounded-lg text-xs font-mono hover:opacity-70 bg-orange-50 text-orange-600 border border-orange-300">
              {{ busyId === runner.id ? '儲存中' : '儲存' }}
            </button>
          </div>
        </div>
      </template>

      <p v-if="runners.length === 0" class="text-xs font-mono text-center py-8 text-gray-400">尚無跑者</p>
    </div>
  </section>
</template>
