import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { lerTodasAsPaginas } from '@/lib/paginacao'

export function useSupabaseTable<T>(tabela: string, ordenarPor: string, ascendente = false) {
  const [data, setData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  // Preenchido só quando o tecto de linhas foi atingido; a página mostra um aviso.
  const [truncado, setTruncado] = useState<{ mostrados: number; total: number } | null>(null)

  const recarregar = useCallback(async () => {
    setIsLoading(true)
    try {
      const resultado = await lerTodasAsPaginas<T>(async (de, ate) => {
        // id como desempate: sem ordem estável, linhas com a mesma data saltavam entre páginas.
        const { data, count, error } = await supabase
          .from(tabela)
          .select('*', de === 0 ? { count: 'exact' } : undefined)
          .order(ordenarPor, { ascending: ascendente })
          .order('id', { ascending: true })
          .range(de, ate)
        return { data: data as T[] | null, count, error }
      })
      setError(null)
      setData(resultado.linhas)
      setTruncado(resultado.truncado && resultado.total !== null ? { mostrados: resultado.linhas.length, total: resultado.total } : null)
    } catch (err: unknown) {
      // Os erros do Supabase são objetos com `message`, não instâncias de Error: guardar a mensagem real.
      const mensagem = (err as { message?: unknown })?.message
      setError(err instanceof Error ? err : new Error(typeof mensagem === 'string' ? mensagem : 'Erro inesperado'))
    }
    setIsLoading(false)
  }, [tabela, ordenarPor, ascendente])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  return { data, isLoading, error, recarregar, truncado }
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
    throw new Error('CONFLITO: este registo foi alterado por outra pessoa entretanto. Atualize a página e tente novamente.')
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
