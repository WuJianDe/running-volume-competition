<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from 'lucide-vue-next'
import type { RunnerInput } from '@/composables/useAdmin'
import TeamPicker from './TeamPicker.vue'

const props = defineProps<{ add: (input: RunnerInput) => Promise<void> }>()

const form = ref<RunnerInput>({ name: '', avatar: '🏃', team: 'A' })
const adding = ref(false)
const error = ref('')

async function submit() {
  if (!form.value.name.trim()) return
  adding.value = true
  error.value = ''
  try {
    await props.add(form.value)
    form.value = { name: '', avatar: '🏃', team: 'A' }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '新增失敗'
  } finally {
    adding.value = false
  }
}
</script>

<template>
  <section class="mb-8">
    <h2 class="text-sm font-semibold mb-3 text-gray-500">新增跑者</h2>
    <div class="rounded-xl p-5 flex flex-col gap-3 bg-white border border-gray-200">
      <div class="grid grid-cols-2 gap-3">
        <label class="col-span-2 md:col-span-1 block">
          <span class="text-xs font-mono mb-1 block text-gray-400">姓名</span>
          <input v-model="form.name" placeholder="例：陳柏翰" class="w-full rounded-lg px-3 py-2 text-sm outline-none bg-gray-50 border border-gray-200" />
        </label>
        <label class="block">
          <span class="text-xs font-mono mb-1 block text-gray-400">頭像 Emoji</span>
          <input v-model="form.avatar" placeholder="🏃" class="w-full rounded-lg px-3 py-2 text-sm outline-none bg-gray-50 border border-gray-200" />
        </label>
      </div>
      <div>
        <span class="text-xs font-mono mb-2 block text-gray-400">隊伍</span>
        <TeamPicker v-model="form.team" />
      </div>
      <p v-if="error" class="text-xs font-mono text-red-600">{{ error }}</p>
      <button
        @click="submit"
        :disabled="adding || !form.name.trim()"
        class="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold bg-orange-50 text-orange-600 border border-orange-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:border-transparent"
      >
        <Plus :size="15" />
        {{ adding ? '新增中...' : '新增跑者' }}
      </button>
    </div>
  </section>
</template>
