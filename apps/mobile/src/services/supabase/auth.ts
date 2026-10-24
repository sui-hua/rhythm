import type { Session } from '@supabase/supabase-js'
import { supabase } from './client'

export async function getCurrentSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export function subscribeToAuthChanges(callback: (session: Session | null) => void) {
  const {
    data: { subscription }
  } = supabase.auth.onAuthStateChange((_, session) => {
    callback(session)
  })

  return () => subscription.unsubscribe()
}

export async function signInWithPassword(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signOut() {
  await supabase.auth.signOut()
}
