import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { EstadoLead, Lead, LeadInsert } from '@/lib/types'

export function useLeads() {
  const [data, setData] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const recarregar = useCallback(async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('criado_em', { ascending: false })

    if (error) setError(error)
    else {
      setError(null)
      setData(data as Lead[])
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  return { data, isLoading, error, recarregar }
}

export async function criarLead(lead: LeadInsert) {
  const { data, error } = await supabase.from('leads').insert(lead).select().single()
  if (error) throw error
  return data as Lead
}

export async function atualizarEstadoLead(id: string, estado: EstadoLead) {
  const { error } = await supabase
    .from('leads')
    .update({ estado, atualizado_em: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
