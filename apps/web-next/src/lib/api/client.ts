/**
 * Nest API 客户端（浏览器端）。
 *
 * 与移动端 `apps/mobile/src/services/api/client.ts` 保持同一套契约：
 * 同一个 base URL 形式、同一个 `x-user-id` 头、同样把非 2xx 转成可读错误。
 * 后续若要抽公共包，这两个文件是候选。
 */

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api'
).replace(/\/+$/, '')

/** 与移动端、prisma/seed.mjs 保持一致 */
export const DEV_USER_ID =
  process.env.NEXT_PUBLIC_API_USER_ID ?? '00000000-0000-4000-8000-000000000001'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type QueryValue = string | number | boolean | null | undefined

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, QueryValue>
}

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const search = Object.entries(query ?? {})
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)

  return `${API_BASE_URL}${path}${search.length ? `?${search.join('&')}` : ''}`
}

function extractMessage(body: unknown, fallback: string) {
  if (typeof body === 'string' && body.trim()) return body
  if (body && typeof body === 'object') {
    const message = (body as { message?: unknown }).message
    if (typeof message === 'string') return message
    if (Array.isArray(message) && message.length > 0) return message.join('；')
  }
  return fallback
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query } = options

  let response: Response

  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        'x-user-id': DEV_USER_ID
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store'
    })
  } catch {
    throw new ApiError(`无法连接后端（${API_BASE_URL}）`, 0)
  }

  const text = await response.text()
  let payload: unknown

  try {
    payload = text ? JSON.parse(text) : undefined
  } catch {
    payload = text
  }

  if (!response.ok) {
    throw new ApiError(extractMessage(payload, `请求失败（HTTP ${response.status}）`), response.status)
  }

  return payload as T
}
