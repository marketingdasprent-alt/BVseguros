import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Apolice, Atividade, Cliente, Proposta, Renovacao, Sinistro } from '@/lib/types'

export interface FichaCliente {
  cliente: Cliente
  apolices: Apolice[]
  propostas: Proposta[]
  sinistros: Sinistro[]
  renovacoes: Renovacao[]
  atividades: Atividade[]
}

// Tudo o que o CRM tem sobre um cliente, em pedidos paralelos (sinistros e renovações
// dependem dos ids das apólices, por isso vêm numa segunda ronda).
export function useFichaCliente(id: string) {
  const [data, setData] = useState<FichaCliente | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [naoExiste, setNaoExiste] = useState(false)

  const recarregar = useCallback(async () => {
    setIsLoading(true)
    try {
      const [cliente, apolices, propostas, atividades] = await Promise.all([
        supabase.from('clientes').select('*').eq('id', id).maybeSingle(),
        supabase.from('apolices').select('*').eq('cliente_id', id).order('data_inicio', { ascending: false }),
        supabase.from('propostas').select('*').eq('cliente_id', id).order('criado_em', { ascending: false }),
        supabase.from('atividades').select('*').eq('cliente_id', id).order('data_atividade', { ascending: false }),
      ])
      const erro = cliente.error ?? apolices.error ?? propostas.error ?? atividades.error
      if (erro) throw erro
      if (!cliente.data) {
        setNaoExiste(true)
        setData(null)
        return
      }

      const idsApolices = (apolices.data ?? []).map((a) => a.id)
      const [sinistros, renovacoes] = idsApolices.length
        ? await Promise.all([
            supabase.from('sinistros').select('*').in('apolice_id', idsApolices).order('data_ocorrencia', { ascending: false }),
            supabase.from('renovacoes').select('*').in('apolice_id', idsApolices).order('criado_em', { ascending: false }),
          ])
        : [{ data: [], error: null }, { data: [], error: null }]
      if (sinistros.error ?? renovacoes.error) throw sinistros.error ?? renovacoes.error

      setNaoExiste(false)
      setError(null)
      setData({
        cliente: cliente.data as Cliente,
        apolices: (apolices.data ?? []) as Apolice[],
        propostas: (propostas.data ?? []) as Proposta[],
        sinistros: (sinistros.data ?? []) as Sinistro[],
        renovacoes: (renovacoes.data ?? []) as Renovacao[],
        atividades: (atividades.data ?? []) as Atividade[],
      })
    } catch (err: unknown) {
      // Erros do Supabase são objetos com message, não instâncias de Error.
      const mensagem = (err as { message?: unknown })?.message
      setError(err instanceof Error ? err : new Error(typeof mensagem === 'string' ? mensagem : 'Erro inesperado'))
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  return { data, isLoading, error, naoExiste, recarregar }
}
