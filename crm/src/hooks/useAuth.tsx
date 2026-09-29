import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { podeFazer } from '@/lib/permissoes'
import type { AcaoPermissao, MinhasPermissoes, Modulo } from '@/lib/permissoes'
import type { Profile } from '@/lib/types'

interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean
  profileLoading: boolean
  profileError: string | null
  isAdmin: boolean
  // Permissões do grupo (null para o admin, que pode tudo, ou conta sem grupo).
  permissoes: MinhasPermissoes | null
  pode: (modulo: Modulo, acao: AcaoPermissao) => boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [permissoes, setPermissoes] = useState<MinhasPermissoes | null>(null)
  // O Supabase volta a emitir SIGNED_IN/TOKEN_REFRESHED ao recuperar o foco do
  // separador; recarregar o perfil aí trocava a app inteira pelo spinner.
  const userIdCarregado = useRef<string | null>(null)

  const carregarProfile = useCallback(async (userId: string) => {
    userIdCarregado.current = userId
    setProfileLoading(true)
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (error) {
      setProfileError(error.message)
      setProfile(null)
      setProfileLoading(false)
      return
    }
    const perfil = data as Profile
    let perms: MinhasPermissoes | null = null
    if (perfil.ativo && !perfil.is_admin) {
      const resposta = await supabase.rpc('minhas_permissoes')
      if (resposta.error) {
        setProfileError(resposta.error.message)
        setProfile(null)
        setProfileLoading(false)
        return
      }
      perms = resposta.data as MinhasPermissoes | null
    }
    setProfileError(null)
    setPermissoes(perms)
    setProfile(perfil)
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
      if (novaSessao) {
        if (novaSessao.user.id !== userIdCarregado.current) carregarProfile(novaSessao.user.id)
      } else {
        userIdCarregado.current = null
        setProfile(null)
        setPermissoes(null)
        setProfileLoading(false)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [carregarProfile])

  const refreshProfile = useCallback(async () => {
    if (session) await carregarProfile(session.user.id)
  }, [session, carregarProfile])

  const isAdmin = !!profile?.is_admin
  const pode = useCallback((modulo: Modulo, acao: AcaoPermissao) => podeFazer(isAdmin, permissoes, modulo, acao), [isAdmin, permissoes])

  return (
    <AuthContext.Provider
      value={{ session, profile, loading, profileLoading, profileError, isAdmin, permissoes, pode, refreshProfile }}
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

// A resposta é igual exista ou não a conta: não se revela quem tem acesso ao CRM.
// O link volta ao CRM com type=recovery, que o DefinirSenha já trata.
export async function pedirRecuperacaoSenha(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: window.location.origin,
  })
  if (!error) return
  const msg = error.message || ''
  if (/security purposes|after \d+ seconds/i.test(msg)) {
    throw new Error('CONFLITO: Já foi pedido um link há instantes. Espere um minuto antes de pedir outro.')
  }
  if (error.status === 429 || /rate limit/i.test(msg)) {
    throw new Error('CONFLITO: Foram pedidos demasiados emails. Tente novamente daqui a algum tempo.')
  }
  throw error
}
