import { supabase } from '@/lib/supabase'
import { useSupabaseTable } from '@/hooks/useSupabaseTable'
import type { Apolice, ApoliceInsert } from '@/lib/types'

export function useApolices() {
  return useSupabaseTable<Apolice>('apolices', 'criado_em')
}

export async function criarApolice(apolice: ApoliceInsert) {
  const { data, error } = await supabase.from('apolices').insert(apolice).select().single()
  if (error) throw error
  return data as Apolice
}
