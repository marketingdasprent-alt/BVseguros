import { supabase } from '@/lib/supabase'
import { useSupabaseTable } from '@/hooks/useSupabaseTable'
import type { EstadoLead, Lead, LeadInsert } from '@/lib/types'

export function useLeads() {
  return useSupabaseTable<Lead>('leads', 'criado_em')
}

export async function criarLead(lead: LeadInsert) {
  const { data, error } = await supabase.from('leads').insert(lead).select().single()
  if (error) throw error
  return data as Lead
}

// Quem não é admin só consegue assumir um lead livre (garantido pelo trigger proteger_responsavel).
export async function atribuirLead(id: string, responsavelId: string | null, atualizadoEmEsperado: string) {
  const { data, error } = await supabase
    .from('leads')
    .update({ responsavel_id: responsavelId, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .eq('atualizado_em', atualizadoEmEsperado)
    .select()
  if (error) throw error
  if (!data || data.length === 0) {
    throw new Error('CONFLITO: este lead foi alterado por outra pessoa entretanto. Atualiza a página e tenta novamente.')
  }
}

export async function atualizarEstadoLead(id: string, estado: EstadoLead, atualizadoEmEsperado: string) {
  const { data, error } = await supabase
    .from('leads')
    .update({ estado, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .eq('atualizado_em', atualizadoEmEsperado)
    .select()
  if (error) throw error
  if (!data || data.length === 0) {
    throw new Error('CONFLITO: este lead foi alterado por outra pessoa entretanto. Atualiza a página e tenta novamente.')
  }
}
