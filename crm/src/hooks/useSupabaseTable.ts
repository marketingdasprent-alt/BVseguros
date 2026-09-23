import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useSupabaseTable<T>(tabela: string, ordenarPor: string, ascendente = false) {
  const [data, setData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const recarregar = useCallback(async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from(tabela)
      .select('*')
      .order(ordenarPor, { ascending: ascendente })

    if (error) setError(error)
    else {
      setError(null)
      setData(data as T[])
    }
    setIsLoading(false)
  }, [tabela, ordenarPor, ascendente])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  return { data, isLoading, error, recarregar }
}
