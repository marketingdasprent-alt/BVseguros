import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { MembroEquipa } from '@/lib/types'

// Nomes da equipa para mostrar e escolher responsáveis (listar_equipa não expõe emails).
export function useEquipa() {
  const [data, setData] = useState<MembroEquipa[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const recarregar = useCallback(async () => {
    setIsLoading(true)
    const { data, error } = await supabase.rpc('listar_equipa')
    if (error) setError(error)
    else {
      setError(null)
      setData(data as MembroEquipa[])
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  const nomePorId = useMemo(() => new Map(data.map((m) => [m.id, m.nome])), [data])
  const ativos = useMemo(() => data.filter((m) => m.ativo), [data])

  return { data, ativos, nomePorId, isLoading, error, recarregar }
}
