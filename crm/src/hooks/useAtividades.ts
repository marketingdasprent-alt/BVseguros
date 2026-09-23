import { supabase } from '@/lib/supabase'
import { useSupabaseTable } from '@/hooks/useSupabaseTable'
import type { Atividade, AtividadeInsert } from '@/lib/types'

export function useAtividades() {
  return useSupabaseTable<Atividade>('atividades', 'data_atividade')
}

export async function criarAtividade(atividade: AtividadeInsert) {
  const { data, error } = await supabase.from('atividades').insert(atividade).select().single()
  if (error) throw error
  return data as Atividade
}

export async function marcarConcluida(id: string, concluida: boolean) {
  const { error } = await supabase.from('atividades').update({ concluida }).eq('id', id)
  if (error) throw error
}
