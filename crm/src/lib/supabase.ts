import { createClient } from '@supabase/supabase-js'

// Capturado antes do createClient() abaixo: o cliente Supabase remove estes
// parâmetros do URL assim que processa a sessão (detectSessionInUrl), por
// isso o tipo de fluxo (convite/recuperação de senha) tem de ser lido já.
const hashParams = new URLSearchParams(window.location.hash.slice(1))
export const authFlowType = hashParams.get('type') as 'invite' | 'recovery' | 'signup' | null

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !key) {
  throw new Error(
    'Faltam as variáveis VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (ver .env.example).',
  )
}

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
})
