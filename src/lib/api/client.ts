import { createClient } from '@/lib/supabase/client'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

/**
 * Authenticated fetch wrapper for the Python/FastAPI backend.
 * Automatically attaches the Supabase JWT as a Bearer token.
 *
 * This replaces the previous axios-based client. All existing API
 * modules (cases.ts, discovery.ts, etc.) should migrate to use
 * the new `api` singleton from `@/lib/api-client` instead.
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  return headers
}

interface RequestOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Record<string, any>
  responseType?: string
}

interface ApiClientInstance {
  get: <T>(url: string, options?: RequestOptions) => Promise<{ data: T }>
  post: <T>(url: string, body?: unknown, options?: RequestOptions) => Promise<{ data: T }>
  put: <T>(url: string, body?: unknown, options?: RequestOptions) => Promise<{ data: T }>
  patch: <T>(url: string, body?: unknown, options?: RequestOptions) => Promise<{ data: T }>
  delete: <T>(url: string, options?: RequestOptions) => Promise<{ data: T }>
}

async function request<T>(method: string, url: string, body?: unknown, options?: RequestOptions): Promise<{ data: T }> {
  const headers = await getAuthHeaders()

  let fullUrl = `${API_BASE}/api/v1${url}`
  if (options?.params) {
    const searchParams = new URLSearchParams()
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, String(value))
    })
    const qs = searchParams.toString()
    if (qs) fullUrl += `?${qs}`
  }

  const response = await fetch(fullUrl, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    throw new Error('Authentication expired')
  }

  if (options?.responseType === 'blob') {
    const blob = await response.blob()
    return { data: blob as unknown as T }
  }

  const json = await response.json()

  if (!response.ok) {
    throw new Error(json.message || json.error || 'API request failed')
  }

  return { data: json }
}

export const apiClient: ApiClientInstance = {
  get: <T>(url: string, options?: RequestOptions) =>
    request<T>('GET', url, undefined, options),
  post: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', url, body, options),
  put: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', url, body, options),
  patch: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', url, body, options),
  delete: <T>(url: string, options?: RequestOptions) =>
    request<T>('DELETE', url, undefined, options),
}
