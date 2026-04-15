<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Trash2, Plus, ArrowLeft, Eye, EyeOff } from 'lucide-vue-next'
import { supabase } from '@/lib/supabase'
import type { Runner } from '@/types/runner'

const router = useRouter()

// ── 密碼驗證 ─────────────────────────────────────────────────
const secret = ref(sessionStorage.getItem('admin_secret') ?? '')
const authenticated = ref(!!secret.value)
const showSecret = ref(false)
const authError = ref('')

function login() {
  if (!secret.value.trim()) return
  sessionStorage.setItem('admin_secret', secret.value)
  authenticated.value = true
  authError.value = ''
  loadRunners()
}

// ── 跑者列表 ─────────────────────────────────────────────────
const runners = ref<Runner[]>([])
const loadingRunners = ref(false)

async function loadRunners() {
  loadingRunners.value = true
  const { data } = await supabase
    .from('runners')
    .select('id, name, avatar, team, distance, elevation, activities')
    .order('team')
  runners.value = (data ?? []) as Runner[]
  loadingRunners.value = false
}

onMounted(() => { if (authenticated.value) loadRunners() })

// ── 新增跑者 ─────────────────────────────────────────────────
const form = ref({ name: '', avatar: '🏃', team: 'A' as 'A' | 'B' })
const adding = ref(false)
const addError = ref('')

async function addRunner() {
  if (!form.value.name.trim()) return
  adding.value = true
  addError.value = ''

  const res = await fetch('/api/admin/add-runner', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': secret.value,
    },
    body: JSON.stringify(form.value),
  })

  const data = await res.json()

  if (!res.ok) {
    addError.value = data.error ?? '新增失敗'
    if (res.status === 401) authenticated.value = false
  } else {
    form.value = { name: '', avatar: '🏃', team: 'A' }
    await loadRunners()
  }
  adding.value = false
}

// ── 刪除跑者 ─────────────────────────────────────────────────
const deletingId = ref<string | null>(null)

async function deleteRunner(id: string) {
  if (!confirm('確定要刪除這位跑者？')) return
  deletingId.value = id

  const res = await fetch('/api/admin/delete-runner', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': secret.value,
    },
    body: JSON.stringify({ id }),
  })

  if (res.ok) {
    runners.value = runners.value.filter(r => r.id !== id)
  }
  deletingId.value = null
}

const teamName = (t: 'A' | 'B') => t === 'A' ? '紅隊' : '藍隊'
const teamColor = (t: 'A' | 'B') => t === 'A' ? '#EC4899' : '#3B82F6'
</script>

<template>
  <div
    class="min-h-full w-full overflow-auto"
    style="background: #0A0A0A; color: #E5E5E5; font-family: 'Outfit', sans-serif"
  >
    <div class="max-w-2xl mx-auto px-5 py-10">

      <!-- 頁首 -->
      <div class="flex items-center gap-3 mb-8">
        <button
          @click="router.push('/')"
          class="flex items-center gap-1.5 text-xs font-mono transition-opacity hover:opacity-60"
          style="color: #525252"
        >
          <ArrowLeft :size="14" /> 返回排行榜
        </button>
        <h1 class="text-lg font-bold ml-auto" style="color: #F5F5F5">管理後台</h1>
      </div>

      <!-- ── 密碼驗證 ── -->
      <div v-if="!authenticated">
        <div
          class="rounded-xl p-6"
          style="background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.08)"
        >
          <p class="text-sm mb-4" style="color: #A3A3A3">請輸入管理員密碼</p>
          <div class="flex gap-2">
            <div class="relative flex-1">
              <input
                v-model="secret"
                :type="showSecret ? 'text' : 'password'"
                placeholder="Admin Secret"
                @keyup.enter="login"
                class="w-full rounded-lg px-3 py-2 text-sm font-mono outline-none"
                style="background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); color: #E5E5E5"
              />
              <button
                @click="showSecret = !showSecret"
                class="absolute right-2 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70"
              >
                <Eye v-if="!showSecret" :size="14" />
                <EyeOff v-else :size="14" />
              </button>
            </div>
            <button
              @click="login"
              class="px-4 py-2 rounded-lg text-sm font-semibold"
              style="background: rgba(245,158,11,.15); color: #FBBF24; border: 1px solid rgba(245,158,11,.2)"
            >
              進入
            </button>
          </div>
          <p v-if="authError" class="text-xs mt-2 font-mono" style="color: #EF4444">{{ authError }}</p>
        </div>
      </div>

      <!-- ── 主內容 ── -->
      <template v-else>

        <!-- 新增跑者 -->
        <section class="mb-8">
          <h2 class="text-sm font-semibold mb-3" style="color: #A3A3A3">新增跑者</h2>
          <div
            class="rounded-xl p-5 flex flex-col gap-3"
            style="background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.08)"
          >
            <div class="grid grid-cols-2 gap-3">
              <!-- 姓名 -->
              <div class="col-span-2 md:col-span-1">
                <label class="text-xs font-mono mb-1 block" style="color: #525252">姓名</label>
                <input
                  v-model="form.name"
                  placeholder="例：陳柏翰"
                  class="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style="background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); color: #E5E5E5"
                />
              </div>
              <!-- Emoji -->
              <div>
                <label class="text-xs font-mono mb-1 block" style="color: #525252">頭像 Emoji</label>
                <input
                  v-model="form.avatar"
                  placeholder="🏃"
                  class="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style="background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); color: #E5E5E5"
                />
              </div>
            </div>

            <!-- 隊伍 -->
            <div>
              <label class="text-xs font-mono mb-2 block" style="color: #525252">隊伍</label>
              <div class="flex gap-3">
                <label
                  v-for="t in (['A', 'B'] as const)"
                  :key="t"
                  class="flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all"
                  :style="form.team === t
                    ? `background: ${teamColor(t)}22; border: 1px solid ${teamColor(t)}66; color: ${teamColor(t)}`
                    : 'background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.08); color: #525252'"
                >
                  <input v-model="form.team" type="radio" :value="t" class="hidden" />
                  <span class="w-2 h-2 rounded-full" :style="{ background: form.team === t ? teamColor(t) : '#525252' }"></span>
                  <span class="text-sm font-semibold">{{ teamName(t) }}</span>
                </label>
              </div>
            </div>

            <p v-if="addError" class="text-xs font-mono" style="color: #EF4444">{{ addError }}</p>

            <button
              @click="addRunner"
              :disabled="adding || !form.name.trim()"
              class="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity"
              :style="adding || !form.name.trim()
                ? 'background: rgba(255,255,255,.05); color: #525252; cursor: not-allowed; opacity: .5'
                : 'background: rgba(245,158,11,.15); color: #FBBF24; border: 1px solid rgba(245,158,11,.2); cursor: pointer'"
            >
              <Plus :size="15" />
              {{ adding ? '新增中...' : '新增跑者' }}
            </button>
          </div>
        </section>

        <!-- 跑者列表 -->
        <section>
          <h2 class="text-sm font-semibold mb-3" style="color: #A3A3A3">
            跑者列表（{{ runners.length }} 人）
          </h2>

          <div v-if="loadingRunners" class="text-xs font-mono text-center py-8 animate-pulse" style="color: #525252">
            載入中...
          </div>

          <div v-else class="flex flex-col gap-2">
            <div
              v-for="runner in runners"
              :key="runner.id"
              class="flex items-center gap-3 px-4 py-3 rounded-lg"
              style="background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.06)"
            >
              <span class="text-lg">{{ runner.avatar }}</span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold" style="color: #E5E5E5">{{ runner.name }}</p>
                <p class="text-xs font-mono" :style="{ color: teamColor(runner.team) }">
                  {{ teamName(runner.team) }}
                </p>
              </div>
              <button
                @click="deleteRunner(runner.id)"
                :disabled="deletingId === runner.id"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-opacity hover:opacity-70"
                style="background: rgba(239,68,68,.1); color: #EF4444; border: 1px solid rgba(239,68,68,.2)"
              >
                <Trash2 :size="12" />
                {{ deletingId === runner.id ? '刪除中' : '刪除' }}
              </button>
            </div>

            <p v-if="runners.length === 0" class="text-xs font-mono text-center py-8" style="color: #525252">
              尚無跑者
            </p>
          </div>
        </section>

      </template>
    </div>
  </div>
</template>
