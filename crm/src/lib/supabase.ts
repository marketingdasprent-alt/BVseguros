import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !key) {
  throw new Error(
    'Faltam as variáveis VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (ver .env.example).',
  )
}

// Links de email no formato antigo traziam a sessão no URL (#access_token=...). Já não
// se aceitam: um clique num link nunca pode trocar a sessão de quem está no CRM. Limpa-se
// o URL (o token não fica no histórico) e o login avisa que é preciso um link novo.
const hash = new URLSearchParams(window.location.hash.slice(1))
export const linkAntigo = hash.has('access_token') || hash.has('error_code')
if (linkAntigo) window.history.replaceState(null, '', window.location.pathname + window.location.search)

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
})

/**
 * Cliente só para a página /acesso: a sessão vive em memória até a senha estar
 * definida. Fechar a página a meio não grava nada nem mexe na sessão do cliente
 * principal (outra chave de armazenamento, sem persistência).
 */
export function clienteIsolado() {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'bv-acesso' },
  })
}
