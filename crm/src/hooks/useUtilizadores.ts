import { supabase } from '@/lib/supabase'
import { useSupabaseTable } from '@/hooks/useSupabaseTable'
import type { AlteracaoAcesso, Profile } from '@/lib/types'

// A RLS só devolve todas as contas a um admin ativo; os outros veem apenas a sua.
export function useUtilizadores() {
  return useSupabaseTable<Profile>('profiles', 'criado_em', true)
}

export async function alterarAcesso(id: string, alteracao: AlteracaoAcesso) {
  const { data, error } = await supabase.from('profiles').update(alteracao).eq('id', id).select().single()
  if (error) throw error
  return data as Profile
}
