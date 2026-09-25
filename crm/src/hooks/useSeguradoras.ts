import { useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useSupabaseTable } from '@/hooks/useSupabaseTable'
import type { Seguradora } from '@/lib/types'

export function useSeguradoras() {
  const resultado = useSupabaseTable<Seguradora>('seguradoras', 'nome', true)
  // O que os formulários oferecem: só as ativas.
  const nomesAtivos = useMemo(() => resultado.data.filter((s) => s.ativa).map((s) => s.nome), [resultado.data])
  return { ...resultado, nomesAtivos }
}

export async function criarSeguradora(nome: string) {
  const { error } = await supabase.from('seguradoras').insert({ nome: nome.trim() })
  if (error) throw error
}

// Na base de dados: passa o nome às apólices/propostas e junta duplicados se o nome já existir.
export async function renomearSeguradora(id: string, nome: string) {
  const { error } = await supabase.rpc('renomear_seguradora', { p_id: id, p_nome: nome })
  if (error) throw error
}

export async function alterarAtivaSeguradora(id: string, ativa: boolean) {
  const { error } = await supabase.from('seguradoras').update({ ativa }).eq('id', id)
  if (error) throw error
}
