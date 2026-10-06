import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { limiteRevisao, type ExportacaoCliente } from '@/lib/rgpd'
import type { Lead, PedidoSinistro } from '@/lib/types'

// Só admin: as duas funções verificam-no na base de dados (migrations/2026-10-06_rgpd.sql).
export async function exportarCliente(id: string): Promise<ExportacaoCliente> {
  const { data, error } = await supabase.rpc('exportar_cliente', { p_id: id })
  if (error) throw error
  return data as ExportacaoCliente
}

export async function anonimizarCliente(id: string, confirmacao: string) {
  const { error } = await supabase.rpc('anonimizar_cliente', { p_id: id, p_confirmacao: confirmacao })
  if (error) throw error
}

export interface RevisaoDados {
  leadsPerdidos: Lead[]
  pedidosSemResposta: Lead[]
  pedidosSinistroArquivados: PedidoSinistro[]
}

/** Registos que passaram o prazo de conservação, para o admin decidir; nada se apaga sozinho. */
export function useRevisaoDados(meses: number) {
  const [data, setData] = useState<RevisaoDados | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const recarregar = useCallback(async () => {
    setIsLoading(true)
    const limite = limiteRevisao(new Date(), meses)
    try {
      const [perdidos, semResposta, arquivados] = await Promise.all([
        supabase.from('leads').select('*').eq('estado', 'perdido').lt('atualizado_em', limite).order('atualizado_em'),
        supabase.from('leads').select('*').eq('origem', 'site').eq('estado', 'novo').is('responsavel_id', null).lt('criado_em', limite).order('criado_em'),
        supabase.from('pedidos_sinistro').select('*').eq('estado', 'arquivado').lt('atualizado_em', limite).order('atualizado_em'),
      ])
      const erro = perdidos.error ?? semResposta.error ?? arquivados.error
      if (erro) throw erro
      setError(null)
      setData({
        leadsPerdidos: (perdidos.data ?? []) as Lead[],
        pedidosSemResposta: (semResposta.data ?? []) as Lead[],
        pedidosSinistroArquivados: (arquivados.data ?? []) as PedidoSinistro[],
      })
    } catch (err: unknown) {
      const mensagem = (err as { message?: unknown })?.message
      setError(err instanceof Error ? err : new Error(typeof mensagem === 'string' ? mensagem : 'Erro inesperado'))
    } finally {
      setIsLoading(false)
    }
  }, [meses])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  return { data, isLoading, error, recarregar }
}
