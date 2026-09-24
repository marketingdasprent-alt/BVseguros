import { supabase } from '@/lib/supabase'
import { useSupabaseTable } from '@/hooks/useSupabaseTable'
import type { AlteracaoAcesso, EventoAcesso, Profile } from '@/lib/types'

// A RLS só devolve todas as contas a um admin ativo; os outros veem apenas a sua.
export function useUtilizadores() {
  return useSupabaseTable<Profile>('profiles', 'criado_em', true)
}

// Só o admin lê o histórico (RLS de eventos_acesso).
export function useEventosAcesso() {
  return useSupabaseTable<EventoAcesso>('eventos_acesso', 'criado_em')
}

export async function alterarAcesso(id: string, alteracao: AlteracaoAcesso) {
  const { data, error } = await supabase.from('profiles').update(alteracao).eq('id', id).select().single()
  if (error) throw error
  return data as Profile
}

// Convidar e excluir passam pela função da Vercel (api/utilizadores.js): exigem a service-role key.
async function chamarApiUtilizadores(method: 'POST' | 'DELETE', corpoPedido: object, erroPadrao: string): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('CONFLITO: A sessão expirou. Inicie sessão novamente.')

  const resposta = await fetch('/api/utilizadores', {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(corpoPedido),
  })
  const corpo = (await resposta.json().catch(() => ({}))) as { message?: string; error?: string }
  if (!resposta.ok) throw new Error(`CONFLITO: ${corpo.error ?? erroPadrao}`)
  return corpo.message ?? ''
}

export function convidarUtilizador(nome: string, email: string) {
  return chamarApiUtilizadores('POST', { nome, email }, 'Não foi possível enviar o convite.')
}

export function excluirUtilizador(id: string) {
  return chamarApiUtilizadores('DELETE', { id }, 'Não foi possível excluir a conta.')
}

export async function alterarNome(id: string, nome: string) {
  const { error } = await supabase.from('profiles').update({ nome: nome.trim() }).eq('id', id)
  if (error) throw error
}
