<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Trash2, Plus, ArrowLeft, Eye, EyeOff, Copy, Check, Pencil, X, Link } from 'lucide-vue-next'
import { supabase } from '@/lib/supabase'
import type { Runner } from '@/types/runner'

const router = useRouter()
const route  = useRoute()

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
  loadSeason()
}

// ── 跑者列表 ─────────────────────────────────────────────────
const runners = ref<Runner[]>([])
const loadingRunners = ref(false)

async function loadRunners() {
  loadingRunners.value = true
  const { data } = await supabase
    .from('runners')
    .select('id, name, avatar, team, distance, elevation, activities, strava_name')
    .order('team')
  runners.value = (data ?? []) as Runner[]
  loadingRunners.value = false
}

onMounted(() => {
  // 處理 Strava OAuth 回呼狀態
  const stravaParam = route.query.strava as string | undefined
  if (stravaParam === 'connected') {
    stravaMessage.value = { text: '管理員 Strava 帳號連結成功', ok: true }
    router.replace({ path: '/admin' })
  } else if (stravaParam === 'denied' || stravaParam === 'error') {
    stravaMessage.value = { text: 'Strava 連結失敗，請再試一次', ok: false }
    router.replace({ path: '/admin' })
  }

  if (authenticated.value) {
    loadRunners()
    loadSeason()
  }
})

// ── 新增跑者 ─────────────────────────────────────────────────
const form = ref({ name: '', avatar: '🏃', team: 'A' as 'A' | 'B', strava_name: '' })
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
    form.value = { name: '', avatar: '🏃', team: 'A', strava_name: '' }
    await loadRunners()
  }
  adding.value = false
}

// ── 賽季設定 ─────────────────────────────────────────────────
const season = ref({ season_start: '', season_end: '', strava_club_id: '' })
const seasonSaving = ref(false)
const seasonError = ref('')
const seasonSuccess = ref(false)
const stravaConnected = ref(false)
const stravaMessage = ref<{ text: string; ok: boolean } | null>(null)

async function loadSeason() {
  const res = await fetch('/api/admin/season')
  if (res.ok) {
    const data = await res.json()
    season.value = {
      season_start:   data.season_start,
      season_end:     data.season_end,
      strava_club_id: data.strava_club_id ?? '',
    }
    stravaConnected.value = data.strava_connected ?? false
  }
}

async function saveSeason() {
  seasonSaving.value = true
  seasonError.value = ''
  seasonSuccess.value = false

  const res = await fetch('/api/admin/season', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': secret.value,
    },
    body: JSON.stringify(season.value),
  })

  const data = await res.json()
  if (res.ok) {
    seasonSuccess.value = true
    setTimeout(() => { seasonSuccess.value = false }, 3000)
  } else {
    seasonError.value = data.error ?? '儲存失敗'
    if (res.status === 401) authenticated.value = false
  }
  seasonSaving.value = false
}

function connectStrava() {
  window.location.href = '/api/strava/admin-auth'
}

// ── 編輯跑者 ─────────────────────────────────────────────────
const editingId = ref<string | null>(null)
const editForm = ref({ name: '', avatar: '', team: 'A' as 'A' | 'B', strava_name: '' })
const editSaving = ref(false)
const editError = ref('')

function startEdit(runner: Runner) {
  editingId.value = runner.id
  editForm.value = { name: runner.name, avatar: runner.avatar, team: runner.team, strava_name: runner.strava_name ?? '' }
  editError.value = ''
}

function cancelEdit() {
  editingId.value = null
  editError.value = ''
}

async function saveEdit() {
  editSaving.value = true
  editError.value = ''

  const res = await fetch('/api/admin/update-runner', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret.value },
    body: JSON.stringify({ id: editingId.value, ...editForm.value }),
  })

  const data = await res.json()
  if (res.ok) {
    const idx = runners.value.findIndex(r => r.id === editingId.value)
    if (idx !== -1) runners.value[idx] = { ...runners.value[idx], ...editForm.value }
    editingId.value = null
  } else {
    editError.value = data.error ?? '儲存失敗'
    if (res.status === 401) authenticated.value = false
  }
  editSaving.value = false
}

// ── 刪除跑者 ─────────────────────────────────────────────────
const deletingId = ref<string | null>(null)
const deleteError = ref('')

async function deleteRunner(id: string) {
  if (!confirm('確定要刪除這位跑者？')) return
  deletingId.value = id
  deleteError.value = ''

  const res = await fetch('/api/admin/delete-runner', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': secret.value,
    },
    body: JSON.stringify({ id }),
  })

  const data = await res.json()

  if (res.ok) {
    runners.value = runners.value.filter(r => r.id !== id)
  } else {
    deleteError.value = `刪除失敗（${res.status}）：${data.error ?? '未知錯誤'}`
    if (res.status === 401) authenticated.value = false
  }
  deletingId.value = null
}

const teamName = (t: 'A' | 'B') => t === 'A' ? '紅隊' : '藍隊'
const teamColor = (t: 'A' | 'B') => t === 'A' ? '#EC4899' : '#3B82F6'

// ── 參賽者連結 ────────────────────────────────────────────────
const copiedId = ref<string | null>(null)

function connectUrl(runnerId: string) {
  return `${window.location.origin}/?connect=${runnerId}`
}

async function copyLink(runnerId: string) {
  await navigator.clipboard.writeText(connectUrl(runnerId))
  copiedId.value = runnerId
  setTimeout(() => { copiedId.value = null }, 2000)
}
</script>

<template>
  <div
    class="min-h-screen w-full"
    style="background: #F9FAFB; color: #111827; font-family: 'Outfit', sans-serif"
  >
    <div class="max-w-2xl mx-auto px-5 py-10">

      <!-- 頁首 -->
      <div class="flex items-center gap-3 mb-8">
        <button
          @click="router.push('/')"
          class="flex items-center gap-1.5 text-xs font-mono transition-opacity hover:opacity-60"
          style="color: #9CA3AF"
        >
          <ArrowLeft :size="14" /> 返回排行榜
        </button>
        <h1 class="text-lg font-bold ml-auto" style="color: #111827">管理後台</h1>
      </div>

      <!-- ── 密碼驗證 ── -->
      <div v-if="!authenticated">
        <div class="rounded-xl p-6" style="background: #FFFFFF; border: 1px solid #E5E7EB">
          <p class="text-sm mb-4" style="color: #6B7280">請輸入管理員密碼</p>
          <div class="flex gap-2">
            <div class="relative flex-1">
              <input
                v-model="secret"
                :type="showSecret ? 'text' : 'password'"
                placeholder="Admin Secret"
                @keyup.enter="login"
                class="w-full rounded-lg px-3 py-2 text-sm font-mono outline-none"
                style="background: #F9FAFB; border: 1px solid #E5E7EB; color: #111827"
              />
              <button
                @click="showSecret = !showSecret"
                class="absolute right-2 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70"
                style="color: #6B7280"
              >
                <Eye v-if="!showSecret" :size="14" />
                <EyeOff v-else :size="14" />
              </button>
            </div>
            <button
              @click="login"
              class="px-4 py-2 rounded-lg text-sm font-semibold"
              style="background: #FFF7ED; color: #EA580C; border: 1px solid #FDBA74"
            >
              進入
            </button>
          </div>
          <p v-if="authError" class="text-xs mt-2 font-mono" style="color: #DC2626">{{ authError }}</p>
        </div>
      </div>

      <!-- ── 主內容 ── -->
      <template v-else>

        <!-- Strava 連線狀態 -->
        <section class="mb-8">
          <h2 class="text-sm font-semibold mb-3" style="color: #6B7280">Strava 管理員帳號</h2>
          <div class="rounded-xl p-5 flex flex-col gap-3" style="background: #FFFFFF; border: 1px solid #E5E7EB">
            <p v-if="stravaMessage" class="text-xs font-mono px-3 py-2 rounded-lg"
              :style="stravaMessage.ok
                ? 'background: #F0FDF4; color: #16A34A; border: 1px solid #BBF7D0'
                : 'background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA'">
              {{ stravaMessage.text }}
            </p>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span
                  class="w-2 h-2 rounded-full"
                  :style="stravaConnected ? 'background: #16A34A' : 'background: #D1D5DB'"
                ></span>
                <span class="text-sm font-mono" style="color: #6B7280">
                  {{ stravaConnected ? '已連結' : '尚未連結' }}
                </span>
              </div>
              <button
                @click="connectStrava"
                class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
                style="background: #FFF7ED; color: #EA580C; border: 1px solid #FDBA74"
              >
                <Link :size="14" />
                {{ stravaConnected ? '重新連結' : '連結 Strava 帳號' }}
              </button>
            </div>
            <p class="text-xs font-mono" style="color: #9CA3AF">
              連結後即可抓取 Strava 社團活動資料，只需連結一次。
            </p>
          </div>
        </section>

        <!-- 賽季設定 -->
        <section class="mb-8">
          <h2 class="text-sm font-semibold mb-3" style="color: #6B7280">賽季區間</h2>
          <div class="rounded-xl p-5 flex flex-col gap-3" style="background: #FFFFFF; border: 1px solid #E5E7EB">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs font-mono mb-1 block" style="color: #9CA3AF">開始日期</label>
                <input
                  v-model="season.season_start"
                  type="date"
                  class="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style="background: #F9FAFB; border: 1px solid #E5E7EB; color: #111827"
                />
              </div>
              <div>
                <label class="text-xs font-mono mb-1 block" style="color: #9CA3AF">結束日期</label>
                <input
                  v-model="season.season_end"
                  type="date"
                  class="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style="background: #F9FAFB; border: 1px solid #E5E7EB; color: #111827"
                />
              </div>
            </div>

            <div>
              <label class="text-xs font-mono mb-1 block" style="color: #9CA3AF">Strava 社團 ID</label>
              <input
                v-model="season.strava_club_id"
                placeholder="例：1234567"
                class="w-full rounded-lg px-3 py-2 text-sm font-mono outline-none"
                style="background: #F9FAFB; border: 1px solid #E5E7EB; color: #111827"
              />
              <p class="text-xs mt-1 font-mono" style="color: #9CA3AF">
                在 Strava 社團頁面的網址列取得，例：strava.com/clubs/<strong>1234567</strong>
              </p>
            </div>

            <p v-if="seasonError" class="text-xs font-mono" style="color: #DC2626">{{ seasonError }}</p>
            <p v-if="seasonSuccess" class="text-xs font-mono" style="color: #16A34A">已儲存設定</p>

            <button
              @click="saveSeason"
              :disabled="seasonSaving || !season.season_start || !season.season_end"
              class="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity"
              :style="seasonSaving || !season.season_start || !season.season_end
                ? 'background: #F3F4F6; color: #9CA3AF; cursor: not-allowed; opacity: .6'
                : 'background: #F0FDF4; color: #16A34A; border: 1px solid #BBF7D0; cursor: pointer'"
            >
              {{ seasonSaving ? '儲存中...' : '儲存設定' }}
            </button>
          </div>
        </section>

        <!-- 新增跑者 -->
        <section class="mb-8">
          <h2 class="text-sm font-semibold mb-3" style="color: #6B7280">新增跑者</h2>
          <div class="rounded-xl p-5 flex flex-col gap-3" style="background: #FFFFFF; border: 1px solid #E5E7EB">
            <div class="grid grid-cols-2 gap-3">
              <!-- 姓名 -->
              <div class="col-span-2 md:col-span-1">
                <label class="text-xs font-mono mb-1 block" style="color: #9CA3AF">姓名</label>
                <input
                  v-model="form.name"
                  placeholder="例：陳柏翰"
                  class="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style="background: #F9FAFB; border: 1px solid #E5E7EB; color: #111827"
                />
              </div>
              <!-- Emoji -->
              <div>
                <label class="text-xs font-mono mb-1 block" style="color: #9CA3AF">頭像 Emoji</label>
                <input
                  v-model="form.avatar"
                  placeholder="🏃"
                  class="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style="background: #F9FAFB; border: 1px solid #E5E7EB; color: #111827"
                />
              </div>
            </div>

            <!-- Strava 名稱 -->
            <div>
              <label class="text-xs font-mono mb-1 block" style="color: #9CA3AF">Strava 顯示名稱</label>
              <input
                v-model="form.strava_name"
                placeholder="例：Po-Han Chen"
                class="w-full rounded-lg px-3 py-2 text-sm font-mono outline-none"
                style="background: #F9FAFB; border: 1px solid #E5E7EB; color: #111827"
              />
              <p class="text-xs mt-1 font-mono" style="color: #9CA3AF">需與 Strava 個人檔案上的姓名完全一致</p>
            </div>

            <!-- 隊伍 -->
            <div>
              <label class="text-xs font-mono mb-2 block" style="color: #9CA3AF">隊伍</label>
              <div class="flex gap-3">
                <label
                  v-for="t in (['A', 'B'] as const)"
                  :key="t"
                  class="flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all"
                  :style="form.team === t
                    ? `background: ${teamColor(t)}18; border: 1px solid ${teamColor(t)}55; color: ${teamColor(t)}`
                    : 'background: #F9FAFB; border: 1px solid #E5E7EB; color: #9CA3AF'"
                >
                  <input v-model="form.team" type="radio" :value="t" class="hidden" />
                  <span class="w-2 h-2 rounded-full" :style="{ background: form.team === t ? teamColor(t) : '#D1D5DB' }"></span>
                  <span class="text-sm font-semibold">{{ teamName(t) }}</span>
                </label>
              </div>
            </div>

            <p v-if="addError" class="text-xs font-mono" style="color: #DC2626">{{ addError }}</p>

            <button
              @click="addRunner"
              :disabled="adding || !form.name.trim()"
              class="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity"
              :style="adding || !form.name.trim()
                ? 'background: #F3F4F6; color: #9CA3AF; cursor: not-allowed; opacity: .6'
                : 'background: #FFF7ED; color: #EA580C; border: 1px solid #FDBA74; cursor: pointer'"
            >
              <Plus :size="15" />
              {{ adding ? '新增中...' : '新增跑者' }}
            </button>
          </div>
        </section>

        <!-- 跑者列表 -->
        <section class="mb-8">
          <p v-if="deleteError" class="text-xs font-mono mb-3 px-3 py-2 rounded-lg" style="color: #DC2626; background: #FEF2F2; border: 1px solid #FECACA">
            {{ deleteError }}
          </p>
          <h2 class="text-sm font-semibold mb-3" style="color: #6B7280">
            跑者列表（{{ runners.length }} 人）
          </h2>

          <div v-if="loadingRunners" class="text-xs font-mono text-center py-8 animate-pulse" style="color: #9CA3AF">
            載入中...
          </div>

          <div v-else class="flex flex-col gap-2">
            <template v-for="runner in runners" :key="runner.id">
              <!-- 一般檢視列 -->
              <div
                v-if="editingId !== runner.id"
                class="flex items-center gap-3 px-4 py-3 rounded-lg"
                style="background: #FFFFFF; border: 1px solid #E5E7EB"
              >
                <span class="text-lg">{{ runner.avatar }}</span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold" style="color: #111827">{{ runner.name }}</p>
                  <p class="text-xs font-mono" :style="{ color: teamColor(runner.team) }">
                    {{ teamName(runner.team) }}
                    <span v-if="runner.strava_name" style="color: #9CA3AF"> · {{ runner.strava_name }}</span>
                    <span v-else style="color: #F97316"> · 未設定 Strava 名稱</span>
                  </p>
                </div>
                <button
                  @click="startEdit(runner)"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-opacity hover:opacity-70"
                  style="background: #F9FAFB; color: #6B7280; border: 1px solid #E5E7EB"
                >
                  <Pencil :size="12" /> 編輯
                </button>
                <button
                  @click="deleteRunner(runner.id)"
                  :disabled="deletingId === runner.id"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-opacity hover:opacity-70"
                  style="background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA"
                >
                  <Trash2 :size="12" />
                  {{ deletingId === runner.id ? '刪除中' : '刪除' }}
                </button>
              </div>

              <!-- 編輯列 -->
              <div
                v-else
                class="flex flex-col gap-3 px-4 py-3 rounded-lg"
                style="background: #FAFAFA; border: 1px solid #FDBA74"
              >
                <div class="grid grid-cols-2 gap-2">
                  <input
                    v-model="editForm.name"
                    placeholder="姓名"
                    class="rounded-lg px-3 py-1.5 text-sm outline-none"
                    style="background: #FFFFFF; border: 1px solid #E5E7EB; color: #111827"
                  />
                  <input
                    v-model="editForm.avatar"
                    placeholder="頭像"
                    class="rounded-lg px-3 py-1.5 text-sm outline-none"
                    style="background: #FFFFFF; border: 1px solid #E5E7EB; color: #111827"
                  />
                  <input
                    v-model="editForm.strava_name"
                    placeholder="Strava 顯示名稱"
                    class="col-span-2 rounded-lg px-3 py-1.5 text-sm font-mono outline-none"
                    style="background: #FFFFFF; border: 1px solid #E5E7EB; color: #111827"
                  />
                </div>
                <div class="flex gap-2">
                  <label
                    v-for="t in (['A', 'B'] as const)" :key="t"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer text-xs font-semibold transition-all"
                    :style="editForm.team === t
                      ? `background: ${teamColor(t)}18; border: 1px solid ${teamColor(t)}55; color: ${teamColor(t)}`
                      : 'background: #F9FAFB; border: 1px solid #E5E7EB; color: #9CA3AF'"
                  >
                    <input v-model="editForm.team" type="radio" :value="t" class="hidden" />
                    {{ teamName(t) }}
                  </label>
                  <div class="flex-1"></div>
                  <p v-if="editError" class="text-xs font-mono self-center" style="color: #DC2626">{{ editError }}</p>
                  <button
                    @click="cancelEdit"
                    class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono transition-opacity hover:opacity-70"
                    style="background: #F9FAFB; color: #6B7280; border: 1px solid #E5E7EB"
                  >
                    <X :size="12" /> 取消
                  </button>
                  <button
                    @click="saveEdit"
                    :disabled="editSaving"
                    class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono transition-opacity hover:opacity-70"
                    style="background: #FFF7ED; color: #EA580C; border: 1px solid #FDBA74"
                  >
                    {{ editSaving ? '儲存中' : '儲存' }}
                  </button>
                </div>
              </div>
            </template>

            <p v-if="runners.length === 0" class="text-xs font-mono text-center py-8" style="color: #9CA3AF">
              尚無跑者
            </p>
          </div>
        </section>

        <!-- 參賽者連結 -->
        <section class="mb-8">
          <h2 class="text-sm font-semibold mb-3" style="color: #6B7280">參賽者連結</h2>
          <div class="flex flex-col gap-2">
            <div
              v-for="runner in runners"
              :key="runner.id"
              class="flex items-center gap-3 px-4 py-3 rounded-lg"
              style="background: #FFFFFF; border: 1px solid #E5E7EB"
            >
              <span class="text-lg shrink-0">{{ runner.avatar }}</span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold" style="color: #111827">{{ runner.name }}</p>
                <p class="text-xs font-mono truncate" style="color: #D1D5DB">{{ connectUrl(runner.id) }}</p>
              </div>
              <button
                @click="copyLink(runner.id)"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono shrink-0 transition-opacity hover:opacity-70"
                :style="copiedId === runner.id
                  ? 'background: #F0FDF4; color: #16A34A; border: 1px solid #BBF7D0'
                  : 'background: #FFF7ED; color: #EA580C; border: 1px solid #FDBA74'"
              >
                <Check v-if="copiedId === runner.id" :size="12" />
                <Copy v-else :size="12" />
                {{ copiedId === runner.id ? '已複製' : '複製' }}
              </button>
            </div>
            <p v-if="runners.length === 0" class="text-xs font-mono text-center py-6" style="color: #9CA3AF">
              尚無跑者
            </p>
          </div>
        </section>

      </template>
    </div>
  </div>
</template>
