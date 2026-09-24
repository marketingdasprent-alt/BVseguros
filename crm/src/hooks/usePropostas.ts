import { supabase } from '@/lib/supabase'
import { useSupabaseTable, atualizarComVersao, apagarRegisto } from '@/hooks/useSupabaseTable'
import type { EstadoProposta, Proposta, PropostaEdicao, PropostaInsert } from '@/lib/types'

export function usePropostas() {
  return useSupabaseTable<Proposta>('propostas', 'criado_em')
}

export async function criarProposta(proposta: PropostaInsert) {
  const { data, error } = await supabase.from('propostas').insert(proposta).select().single()
  if (error) throw error
  return data as Proposta
}

export async function atualizarEstadoProposta(id: string, estado: EstadoProposta, atualizadoEmEsperado: string) {
  const { data, error } = await supabase
    .from('propostas')
    .update({ estado, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .eq('atualizado_em', atualizadoEmEsperado)
    .select()
  if (error) throw error
  if (!data || data.length === 0) {
    throw new Error('CONFLITO: esta proposta foi alterada por outra pessoa entretanto. Atualiza a página e tenta novamente.')
  }
}

export async function atualizarProposta(id: string, dados: PropostaEdicao, atualizadoEmEsperado: string) {
  await atualizarComVersao('propostas', id, dados, atualizadoEmEsperado)
}

export async function apagarProposta(id: string) {
  await apagarRegisto('propostas', id)
}