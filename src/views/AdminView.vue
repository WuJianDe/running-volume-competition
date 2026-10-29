<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Eye, EyeOff } from 'lucide-vue-next'
import { useAdmin } from '@/composables/useAdmin'
import RunnerForm from '@/components/admin/RunnerForm.vue'
import RunnerList from '@/components/admin/RunnerList.vue'
import SeasonForm from '@/components/admin/SeasonForm.vue'

const router = useRouter()
const { authenticated, authError, runners, season, loading, login, logout, restoreSession, addRunner, updateRunner, deleteRunner, saveSeason } = useAdmin()
const secretInput = ref('')
const showSecret = ref(false)

onMounted(restoreSession)
</script>

<template>
  <div class="min-h-screen w-full bg-gray-50 text-gray-900" style="font-family: 'Outfit', sans-serif">
    <div class="max-w-2xl mx-auto px-5 py-10">
      <div class="flex items-center gap-3 mb-8">
        <button @click="router.push('/')" class="flex items-center gap-1.5 text-xs font-mono text-gray-400 hover:opacity-60">
          <ArrowLeft :size="14" /> 返回排行榜
        </button>
        <h1 class="text-lg font-bold ml-auto">管理後台</h1>
        <button v-if="authenticated" @click="logout()" class="text-xs font-mono text-gray-400 hover:opacity-60">登出</button>
      </div>

      <div v-if="!authenticated" class="rounded-xl p-6 bg-white border border-gray-200">
        <p class="text-sm mb-4 text-gray-500">請輸入管理員密碼</p>
        <div class="flex gap-2">
          <div class="relative flex-1">
            <input
              v-model="secretInput"
              :type="showSecret ? 'text' : 'password'"
              placeholder="Admin Secret"
              @keyup.enter="login(secretInput)"
              class="w-full rounded-lg px-3 py-2 text-sm font-mono outline-none bg-gray-50 border border-gray-200"
            />
            <button @click="showSecret = !showSecret" class="absolute right-2 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70 text-gray-500">
              <Eye v-if="!showSecret" :size="14" /><EyeOff v-else :size="14" />
            </button>
          </div>
          <button @click="login(secretInput)" class="px-4 py-2 rounded-lg text-sm font-semibold bg-orange-50 text-orange-600 border border-orange-300">進入</button>
        </div>
        <p v-if="authError" class="text-xs mt-2 font-mono text-red-600">{{ authError }}</p>
      </div>

      <template v-else>
        <SeasonForm v-model="season" :save="saveSeason" />
        <RunnerForm :add="addRunner" />
        <RunnerList :runners="runners" :loading="loading" :update="updateRunner" :remove="deleteRunner" />
      </template>
    </div>
  </div>
</template>
