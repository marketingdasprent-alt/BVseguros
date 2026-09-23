import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface DashboardResumo {
  total_clientes: number
  apolices_ativas: number
  renovacoes_30_dias: number
  propostas_em_aberto: number
  sinistros_em_aberto: number
}

export function useDashboardResumo() {
  const [data, setData] = useState<DashboardResumo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const recarregar = useCallback(async () => {
    setIsLoading(true)
    const { data, error } = await supabase.rpc('obter_resumo_dashboard').single()
    if (error) setError(error)
    else {
      setError(null)
      setData(data as DashboardResumo)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  return { data, isLoading, error, recarregar }
}
