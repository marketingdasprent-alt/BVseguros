import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Cliente, ClienteInsert } from '@/lib/types'

export function useClientes() {
  const [data, setData] = useState<Cliente[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const recarregar = useCallback(async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('criado_em', { ascending: false })

    if (error) setError(error)
    else {
      setError(null)
      setData(data as Cliente[])
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  return { data, isLoading, error, recarregar }
}

export async function criarCliente(cliente: ClienteInsert) {
  const { data, error } = await supabase.from('clientes').insert(cliente).select().single()
  if (error) throw error
  return data as Cliente
}
