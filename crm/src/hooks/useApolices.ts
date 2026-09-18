import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Apolice, ApoliceInsert } from '@/lib/types'

export function useApolices() {
  const [data, setData] = useState<Apolice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const recarregar = useCallback(async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('apolices')
      .select('*')
      .order('criado_em', { ascending: false })

    if (error) setError(error)
    else {
      setError(null)
      setData(data as Apolice[])
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  return { data, isLoading, error, recarregar }
}

export async function criarApolice(apolice: ApoliceInsert) {
  const { data, error } = await supabase.from('apolices').insert(apolice).select().single()
  if (error) throw error
  return data as Apolice
}
