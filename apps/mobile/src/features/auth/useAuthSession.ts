import { useEffect, useState } from 'react'
import { getCurrentSession, subscribeToAuthChanges } from '@/services/supabase/auth'

type AuthSession = Awaited<ReturnType<typeof getCurrentSession>>

// Dev mock session - set this to bypass auth in development
let _devMockSession: AuthSession | null = null

export function setDevMockSession(session: AuthSession | null) {
  _devMockSession = session
}

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
    session: _devMockSession ?? session,
    isReady,
    isAuthenticated: Boolean(_devMockSession ?? session)
  }
}
