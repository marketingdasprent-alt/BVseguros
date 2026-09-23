import { supabase } from '@/lib/supabase'
import { useSupabaseTable } from '@/hooks/useSupabaseTable'
import type { EstadoSinistro, Sinistro, SinistroInsert } from '@/lib/types'

export function useSinistros() {
  return useSupabaseTable<Sinistro>('sinistros', 'criado_em')
}

export async function criarSinistro(sinistro: SinistroInsert) {
  const { data, error } = await supabase.from('sinistros').insert(sinistro).select().single()
  if (error) throw error
  return data as Sinistro
}

export async function atualizarEstadoSinistro(id: string, estado: EstadoSinistro, atualizadoEmEsperado: string) {
  const { data, error } = await supabase
    .from('sinistros')
    .update({ estado, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .eq('atualizado_em', atualizadoEmEsperado)
    .select()
  if (error) throw error
  if (!data || data.length === 0) {
    throw new Error('CONFLITO: este sinistro foi alterado por outra pessoa entretanto. Atualiza a página e tenta novamente.')
  }
}
