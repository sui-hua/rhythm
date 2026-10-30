import { useEffect, useState } from 'react'
import {
  getSession,
  signInLocal,
  signOutLocal,
  subscribeSession,
  type AppSession
} from '@/services/api/session'

/**
 * 会话 hook。
 *
 * 由 Supabase Auth 改为本地会话：登录只记下邮箱与固定 user_id，
 * 请求时通过 `x-user-id` 传给 Nest。等后端补上 JWT 后，
 * 只需把 signInLocal / signOutLocal 换成真实接口，本 hook 不用动。
 *
 * 会话不落盘，重启 App 需重新登录 —— 这是认证模块落地前的临时行为。
 */
export function useAuthSession() {
  const [session, setSession] = useState<AppSession | null>(() => getSession())

  useEffect(() => subscribeSession(setSession), [])

  return {
    session,
    isReady: true,
    isAuthenticated: Boolean(session)
  }
}

export { signInLocal, signOutLocal }
export type { AppSession }
