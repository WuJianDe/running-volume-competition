export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || `${import.meta.env.BASE_URL}api`).replace(/\/$/, '')

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: { Accept: 'application/json', ...init.headers },
  })
  let data: T & { error?: string }
  try {
    data = await response.json() as T & { error?: string }
  } catch {
    throw new ApiError('API did not return JSON. Please check the PHP API deployment path.', response.status)
  }
  if (!response.ok) throw new ApiError(data.error || 'Request failed', response.status)
  return data
}

export function adminHeaders(secret: string): HeadersInit {
  return { 'Content-Type': 'application/json', 'X-Admin-Secret': secret }
}
