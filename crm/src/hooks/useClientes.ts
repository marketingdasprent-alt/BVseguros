import { supabase } from '@/lib/supabase'
import { useSupabaseTable } from '@/hooks/useSupabaseTable'
import type { Cliente, ClienteInsert } from '@/lib/types'

export function useClientes() {
  return useSupabaseTable<Cliente>('clientes', 'criado_em')
}

export async function criarCliente(cliente: ClienteInsert) {
  const { data, error } = await supabase.from('clientes').insert(cliente).select().single()
  if (error) throw error
  return data as Cliente
}
