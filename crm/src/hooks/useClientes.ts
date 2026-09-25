import { supabase } from '@/lib/supabase'
import { useSupabaseTable, atualizarRegisto, apagarRegisto } from '@/hooks/useSupabaseTable'
import type { Cliente, ClienteEdicao, ClienteInsert } from '@/lib/types'

export function useClientes() {
  return useSupabaseTable<Cliente>('clientes', 'criado_em')
}

export async function criarCliente(cliente: ClienteInsert) {
  const { data, error } = await supabase.from('clientes').insert(cliente).select().single()
  if (error) throw error
  return data as Cliente
}

export async function atribuirCliente(id: string, responsavelId: string | null) {
  const { error } = await supabase.from('clientes').update({ responsavel_id: responsavelId }).eq('id', id)
  if (error) throw error
}

export async function atualizarCliente(id: string, dados: ClienteEdicao) {
  await atualizarRegisto('clientes', id, dados)
}

export async function apagarCliente(id: string) {
  await apagarRegisto('clientes', id)
}