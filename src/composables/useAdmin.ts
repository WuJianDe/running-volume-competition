import { ref } from 'vue'
import { ApiError, adminApi, adminSecretStore, api } from '@/lib/api'
import type { TeamId } from '@/lib/teams'
import type { AdminRunner, Season } from '@/types/runner'

export interface RunnerInput {
  name: string
  avatar: string
  team: TeamId
}

export function useAdmin() {
  const secret = ref(adminSecretStore.get())
  const authenticated = ref(false)
  const authError = ref('')
  const runners = ref<AdminRunner[]>([])
  const season = ref<Season>({ season_start: '', season_end: '' })
  const loading = ref(false)

  function logout() {
    adminSecretStore.clear()
    authenticated.value = false
  }

  /** 執行管理 API；密碼失效（401）時自動登出，其餘錯誤交給呼叫端顯示。 */
  async function call<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
    try {
      return await adminApi<T>(secret.value, path, method, body)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout()
        authError.value = '管理密碼錯誤或已失效'
      }
      throw err
    }
  }

  async function loadAll() {
    loading.value = true
    try {
      const [list, current] = await Promise.all([
        call<AdminRunner[]>('/admin/runners'),
        api<Season>('/season'),
      ])
      runners.value = list
      season.value = { season_start: current.season_start, season_end: current.season_end }
    } finally {
      loading.value = false
    }
  }

  async function login(input: string) {
    authError.value = ''
    secret.value = input.trim()
    if (!secret.value) return
    try {
      await adminApi(secret.value, '/admin/login', 'POST')
    } catch (err) {
      adminSecretStore.clear()
      authError.value = err instanceof ApiError && err.status === 401
        ? '管理密碼錯誤'
        : (err instanceof Error ? err.message : '登入失敗')
      return
    }
    adminSecretStore.set(secret.value)
    authenticated.value = true
    await loadAll()
  }

  async function restoreSession() {
    if (secret.value) await login(secret.value)
  }

  const addRunner = async (input: RunnerInput) => { await call('/admin/runners', 'POST', input); await loadAll() }
  const updateRunner = async (id: string, input: RunnerInput) => { await call(`/admin/runners/${id}`, 'PATCH', input); await loadAll() }
  const deleteRunner = async (id: string) => { await call(`/admin/runners/${id}`, 'DELETE'); await loadAll() }
  const saveSeason = async () => { await call('/admin/season', 'PUT', season.value) }

  return {
    authenticated, authError, runners, season, loading,
    login, logout, restoreSession, addRunner, updateRunner, deleteRunner, saveSeason,
  }
}
