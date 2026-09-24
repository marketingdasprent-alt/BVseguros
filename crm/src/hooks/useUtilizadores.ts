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

export async function alterarNome(id: string, nome: string) {
  const { error } = await supabase.from('profiles').update({ nome: nome.trim() }).eq('id', id)
  if (error) throw error
}
