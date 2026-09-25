import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { EntradaHistorico } from '@/lib/historico'

const LIMITE = 100

// Histórico de tudo o que diz respeito a um cliente (o próprio, apólices, propostas,
// sinistros, renovações), mais recente primeiro.
export function useHistoricoCliente(clienteId: string) {
  const [data, setData] = useState<EntradaHistorico[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const recarregar = useCallback(async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('historico_registos')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('criado_em', { ascending: false })
      .limit(LIMITE)
    if (error) setError(error)
    else {
      setError(null)
      setData(data as EntradaHistorico[])
    }
    setIsLoading(false)
  }, [clienteId])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  return { data, isLoading, error, recarregar }
}
