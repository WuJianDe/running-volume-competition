export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || `${import.meta.env.BASE_URL}api.php`

export function apiUrl(path: string, params: Record<string, string> = {}): string {
  const url = new URL(apiBaseUrl, window.location.origin)
  url.searchParams.set('_route', path)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  return url.toString()
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: { Accept: 'application/json', ...init.headers },
  })
  let data: T & { error?: string }
  try {
    data = await response.json() as T & { error?: string }
  } catch {
    throw new ApiError(`API did not return JSON (HTTP ${response.status}). Check api/index.php, api/.htaccess, and config.local.php.`, response.status)
  }
  if (!response.ok) throw new ApiError(data.error || 'Request failed', response.status)
  return data
}

export function adminHeaders(secret: string): HeadersInit {
  return { 'Content-Type': 'application/json', 'X-Admin-Secret': secret }
}

export function adminApi<T>(secret: string, path: string, method = 'GET', body?: unknown): Promise<T> {
  return api<T>(path, {
    method,
    headers: adminHeaders(secret),
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

const ADMIN_SECRET_KEY = 'admin_secret'

export const adminSecretStore = {
  get: () => sessionStorage.getItem(ADMIN_SECRET_KEY) ?? '',
  set: (secret: string) => sessionStorage.setItem(ADMIN_SECRET_KEY, secret),
  clear: () => sessionStorage.removeItem(ADMIN_SECRET_KEY),
}
