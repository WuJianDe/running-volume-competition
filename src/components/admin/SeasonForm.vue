<script setup lang="ts">
import { ref } from 'vue'
import type { Season } from '@/types/runner'

const season = defineModel<Season>({ required: true })
const props = defineProps<{ save: () => Promise<void> }>()

const saving = ref(false)
const error = ref('')
const saved = ref(false)

async function submit() {
  saving.value = true
  error.value = ''
  saved.value = false
  try {
    await props.save()
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '儲存失敗'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="mb-8">
    <h2 class="text-sm font-semibold mb-3 text-gray-500">賽季區間</h2>
    <div class="rounded-xl p-5 flex flex-col gap-3 bg-white border border-gray-200">
      <div class="grid grid-cols-2 gap-3">
        <label class="block">
          <span class="text-xs font-mono mb-1 block text-gray-400">開始日期</span>
          <input v-model="season.season_start" type="date" class="w-full rounded-lg px-3 py-2 text-sm outline-none bg-gray-50 border border-gray-200" />
        </label>
        <label class="block">
          <span class="text-xs font-mono mb-1 block text-gray-400">結束日期</span>
          <input v-model="season.season_end" type="date" class="w-full rounded-lg px-3 py-2 text-sm outline-none bg-gray-50 border border-gray-200" />
        </label>
      </div>
      <p v-if="error" class="text-xs font-mono text-red-600">{{ error }}</p>
      <p v-if="saved" class="text-xs font-mono text-green-600">已儲存設定</p>
      <button
        @click="submit"
        :disabled="saving || !season.season_start || !season.season_end"
        class="w-full py-2.5 rounded-lg text-sm font-semibold bg-green-50 text-green-600 border border-green-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:border-transparent"
      >
        {{ saving ? '儲存中...' : '儲存設定' }}
      </button>
    </div>
  </section>
</template>
