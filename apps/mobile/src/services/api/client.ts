import { getRequestUserId } from './session'

/**
 * Nest API 的轻量客户端。
 *
 * 只做三件事：拼 URL、注入用户标识、把非 2xx 响应转成可读错误。
 * 业务字段的 snake_case → camelCase 映射放在各资源模块里。
 */

const DEFAULT_BASE_URL = 'http://localhost:3001/api'

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, '')

const REQUEST_TIMEOUT_MS = 15000

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export type QueryValue = string | number | boolean | null | undefined

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, QueryValue>
  signal?: AbortSignal
}

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const search: string[] = []

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue
    search.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
  }

  const suffix = search.length > 0 ? `?${search.join('&')}` : ''
  return `${API_BASE_URL}${path}${suffix}`
}

/** 从 Nest 的错误体里抽出可展示的文案 */
function extractMessage(body: unknown, fallback: string): string {
  if (typeof body === 'string' && body.trim()) return body
  if (body && typeof body === 'object') {
    const message = (body as { message?: unknown }).message
    if (typeof message === 'string') return message
    if (Array.isArray(message) && message.length > 0) return message.join('；')
  }
  return fallback
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, signal } = options

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const abortFromCaller = () => controller.abort()
  signal?.addEventListener('abort', abortFromCaller)

  try {
    const response = await fetch(buildUrl(path, query), {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        'x-user-id': getRequestUserId()
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal
    })

    // 204 与空响应体不解析
    const text = await response.text()
    const payload = text ? safeParse(text) : undefined

    if (!response.ok) {
      throw new ApiError(
        extractMessage(payload, `请求失败（HTTP ${response.status}）`),
        response.status,
        payload
      )
    }

    return payload as T
  } catch (error) {
    if (error instanceof ApiError) throw error
    if ((error as Error)?.name === 'AbortError') {
      throw new ApiError('请求超时，请检查后端服务是否已启动', 0, null)
    }
    throw new ApiError(`无法连接后端（${API_BASE_URL}）`, 0, error)
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', abortFromCaller)
  }
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}
