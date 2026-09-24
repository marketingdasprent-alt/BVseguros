import { supabase } from '@/lib/supabase'
import { useSupabaseTable, atualizarComVersao, apagarRegisto } from '@/hooks/useSupabaseTable'
import type { Cliente, ClienteEdicao, EstadoLead, Lead, LeadEdicao, LeadInsert } from '@/lib/types'

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

export async function atualizarLead(id: string, dados: LeadEdicao, atualizadoEmEsperado: string) {
  await atualizarComVersao('leads', id, dados, atualizadoEmEsperado)
}

export async function apagarLead(id: string) {
  await apagarRegisto('leads', id)
}

// Uma só transação no Supabase: cria o cliente, passa-lhe propostas/atividades e marca o lead.
export async function converterLead(lead: Lead, cliente: ClienteEdicao) {
  const { data, error } = await supabase
    .rpc('converter_lead', {
      p_lead_id: lead.id,
      p_atualizado_em: lead.atualizado_em,
      p_nome: cliente.nome,
      p_telefone: cliente.telefone,
      p_email: cliente.email,
      p_nif: cliente.nif,
      p_morada: cliente.morada,
    })
    .single()
  if (error) throw error
  return data as Cliente
}