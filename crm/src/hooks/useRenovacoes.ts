import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Apolice, Renovacao } from '@/lib/types'

export interface RenovacaoItem {
  apolice: Apolice
  renovacao: Renovacao | null
}

export function useRenovacoes(diasLimite = 60) {
  const [data, setData] = useState<RenovacaoItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const recarregar = useCallback(async () => {
    setIsLoading(true)

    const hoje = new Date()
    const limite = new Date()
    limite.setDate(hoje.getDate() + diasLimite)
    const hojeIso = hoje.toISOString().slice(0, 10)
    const limiteIso = limite.toISOString().slice(0, 10)

    const { data: apolices, error: erroApolices } = await supabase
      .from('apolices')
      .select('*')
      .eq('estado', 'ativa')
      .gte('data_fim', hojeIso)
      .lte('data_fim', limiteIso)
      .order('data_fim', { ascending: true })

    if (erroApolices) {
      setError(erroApolices)
      setIsLoading(false)
      return
    }

    const apoliceIds = (apolices ?? []).map((a) => a.id)
    let renovacoes: Renovacao[] = []

    if (apoliceIds.length > 0) {
      const { data: renovacoesData, error: erroRenovacoes } = await supabase
        .from('renovacoes')
        .select('*')
        .in('apolice_id', apoliceIds)
        .order('criado_em', { ascending: false })

      if (erroRenovacoes) {
        setError(erroRenovacoes)
        setIsLoading(false)
        return
      }
      renovacoes = renovacoesData as Renovacao[]
    }

    const itens: RenovacaoItem[] = (apolices as Apolice[]).map((apolice) => ({
      apolice,
      renovacao:
        renovacoes.find((r) => r.apolice_id === apolice.id && r.data_fim_anterior === apolice.data_fim) ?? null,
    }))

    setError(null)
    setData(itens)
    setIsLoading(false)
  }, [diasLimite])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  return { data, isLoading, error, recarregar }
}

export async function marcarContactado(apolice: Apolice, renovacaoIdExistente: string | null) {
  if (renovacaoIdExistente) {
    const { error } = await supabase
      .from('renovacoes')
      .update({ estado: 'contactado', atualizado_em: new Date().toISOString() })
      .eq('id', renovacaoIdExistente)
    if (error) throw error
    return
  }

  const { error } = await supabase.from('renovacoes').insert({
    apolice_id: apolice.id,
    data_fim_anterior: apolice.data_fim,
    estado: 'contactado',
    notas: null,
  })
  if (error) throw error
}

export async function marcarRenovada(
  apolice: Apolice,
  renovacaoIdExistente: string | null,
  novaDataFim: string,
  novoPremio: number | null,
) {
  // grava apólice + renovação numa única transação no lado da BD (função marcar_renovada)
  const { error } = await supabase.rpc('marcar_renovada', {
    p_apolice_id: apolice.id,
    p_renovacao_id: renovacaoIdExistente,
    p_data_fim_anterior: apolice.data_fim,
    p_nova_data_fim: novaDataFim,
    p_novo_premio: novoPremio,
  })
  if (error) throw error
}
