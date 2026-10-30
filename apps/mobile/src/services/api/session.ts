/**
 * 本地会话。
 *
 * 原实现走 Supabase Auth，迁移到自托管 Nest API 后认证模块尚未落地，
 * 这里先用进程内会话占位：登录只记下邮箱与固定 user_id，请求时通过
 * `x-user-id` 传给后端。等 Nest 侧补上 JWT，只需改本文件与 client.ts。
 *
 * 注意：会话不落盘，重启 App 需要重新登录。这是临时行为，不是遗漏。
 */

export type AppUser = {
  id: string
  email: string
}

export type AppSession = {
  user: AppUser
}

/**
 * 开发默认用户。
 * 后端 `user_id` 是无外键的 uuid 列，任意合法 uuid 都能写入，
 * 该值同时被 `prisma/seed.mjs` 用来灌演示数据，两边必须保持一致。
 */
export const DEV_USER_ID = process.env.EXPO_PUBLIC_API_USER_ID ?? '00000000-0000-4000-8000-000000000001'

let currentSession: AppSession | null = null
const listeners = new Set<(session: AppSession | null) => void>()

function notify() {
  for (const listener of listeners) listener(currentSession)
}

export function getSession(): AppSession | null {
  return currentSession
}

export function setSession(session: AppSession | null) {
  currentSession = session
  notify()
}

export function signInLocal(email: string): AppSession {
  const session: AppSession = { user: { id: DEV_USER_ID, email } }
  setSession(session)
  return session
}

export function signOutLocal() {
  setSession(null)
}

export function subscribeSession(listener: (session: AppSession | null) => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** 请求头里的用户标识；未登录时回退到开发用户，避免联调期直接 401 */
export function getRequestUserId(): string {
  return currentSession?.user.id ?? DEV_USER_ID
}
