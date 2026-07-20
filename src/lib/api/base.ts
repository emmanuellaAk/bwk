import { tokenStore } from './token'

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Normalise a local Ghana number (0XXXXXXXXX) to E.164 (+233XXXXXXXXX)
export function toE164(phone: string): string {
  const digits = phone.replace(/\s+|-/g, '')
  if (digits.startsWith('0') && digits.length === 10) {
    return `+233${digits.slice(1)}`
  }
  return digits // already formatted or unknown — backend will validate
}

export async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // sends the httpOnly cookie
    })
    if (!res.ok) { tokenStore.clear(); return false }
    const { access_token } = await res.json() as { access_token: string }
    tokenStore.set(access_token)
    return true
  } catch {
    tokenStore.clear()
    return false
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStore.get()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const send = (t?: string) =>
    fetch(`${BASE}${path}`, {
      ...init,
      credentials: 'include',
      headers: { ...headers, ...(t ? { Authorization: `Bearer ${t}` } : {}) },
    })

  let res = await send()

  // On 401, try a silent refresh then retry once
  if (res.status === 401 && token) {
    const ok = await tryRefresh()
    if (ok) {
      res = await send(tokenStore.get()!)
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>
    throw new ApiError(
      res.status,
      (body['code'] as string | undefined) ?? 'UNKNOWN',
      (body['message'] as string | undefined) ?? `HTTP ${res.status}`,
    )
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  get:    <T>(path: string)                  => request<T>(path, { method: 'GET' }),
  post:   <T>(path: string, body?: unknown)  => request<T>(path, { method: 'POST',  body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch:  <T>(path: string, body?: unknown)  => request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string)                  => request<T>(path, { method: 'DELETE' }),
}
