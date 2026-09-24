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

// Grava só se o registo não mudou desde que foi lido (tabelas com atualizado_em).
export async function atualizarComVersao(tabela: string, id: string, dados: object, atualizadoEmEsperado: string) {
  const { data, error } = await supabase
    .from(tabela)
    .update({ ...dados, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .eq('atualizado_em', atualizadoEmEsperado)
    .select('id')
  if (error) throw error
  if (!data || data.length === 0) {
    throw new Error('CONFLITO: este registo foi alterado por outra pessoa entretanto. Atualiza a página e tenta novamente.')
  }
}

export async function atualizarRegisto(tabela: string, id: string, dados: object) {
  const { error } = await supabase.from(tabela).update(dados).eq('id', id)
  if (error) throw error
}

// A RLS só deixa o admin apagar; para os outros o delete não dá erro, só apaga 0 linhas.
export async function apagarRegisto(tabela: string, id: string) {
  const { data, error } = await supabase.from(tabela).delete().eq('id', id).select('id')
  if (error) throw error
  if (!data || data.length === 0) throw new Error('CONFLITO: Só o administrador pode apagar registos.')
}
