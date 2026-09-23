import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/types'

interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean
  profileLoading: boolean
  profileError: string | null
  isAdmin: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  const carregarProfile = useCallback(async (userId: string) => {
    setProfileLoading(true)
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (error) {
      setProfileError(error.message)
      setProfile(null)
      setProfileLoading(false)
      return
    }
    setProfileError(null)
    setProfile(data as Profile)
    setProfileLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) carregarProfile(data.session.user.id)
      else setProfileLoading(false)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSession(novaSessao)
      if (novaSessao) carregarProfile(novaSessao.user.id)
      else {
        setProfile(null)
        setProfileLoading(false)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [carregarProfile])

  const refreshProfile = useCallback(async () => {
    if (session) await carregarProfile(session.user.id)
  }, [session, carregarProfile])

  return (
    <AuthContext.Provider
      value={{ session, profile, loading, profileLoading, profileError, isAdmin: !!profile?.is_admin, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
