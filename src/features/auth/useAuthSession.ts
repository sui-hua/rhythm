import { useEffect, useState } from 'react'
import { getCurrentSession, subscribeToAuthChanges } from '@/services/supabase/auth'

type AuthSession = Awaited<ReturnType<typeof getCurrentSession>>

export function useAuthSession() {
  const [session, setSession] = useState<AuthSession>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let mounted = true

    getCurrentSession().then((nextSession) => {
      if (!mounted) return
      setSession(nextSession)
      setIsReady(true)
    })

    const unsubscribe = subscribeToAuthChanges((nextSession) => {
      setSession(nextSession)
      setIsReady(true)
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  return {
    session,
    isReady,
    isAuthenticated: Boolean(session)
  }
}
