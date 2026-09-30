import { useCallback, useEffect, useId, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { atualizarComVersao, useSupabaseTable } from '@/hooks/useSupabaseTable'
import type { PedidoSinistro, PedidoSinistroEdicao } from '@/lib/types'

// A RLS mostra os pedidos a quem tem o módulo Sinistros; chegam só pelo site (criar_pedido_sinistro_site).
export function usePedidosSinistro() {
  return useSupabaseTable<PedidoSinistro>('pedidos_sinistro', 'criado_em')
}

export async function atualizarPedidoSinistro(id: string, dados: PedidoSinistroEdicao, atualizadoEmEsperado: string) {
  await atualizarComVersao('pedidos_sinistro', id, dados, atualizadoEmEsperado)
}

// Cria o sinistro na apólice e fecha o pedido numa só operação (função na base de dados).
export async function converterPedidoSinistro(pedidoId: string, apoliceId: string, descricao: string) {
  const { data, error } = await supabase.rpc('converter_pedido_sinistro', {
    p_pedido: pedidoId,
    p_apolice: apoliceId,
    p_descricao: descricao,
  })
  if (error) throw error
  return data as string
}

const INTERVALO_MS = 60_000

// Pedidos de sinistro ainda em "Novo", para o número no menu. Mesmo esquema do useLeadsPorTratar.
export function usePedidosSinistroNovos(ativo: boolean) {
  const [total, setTotal] = useState(0)
  const canal = useId()

  const contar = useCallback(async () => {
    const { count, error } = await supabase
      .from('pedidos_sinistro')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'novo')
    if (error) console.warn('Não foi possível contar os pedidos de sinistro:', error.message)
    else setTotal(count ?? 0)
  }, [])

  useEffect(() => {
    // Sem o módulo Sinistros a RLS devolveria sempre 0: não vale a pena perguntar.
    if (!ativo) return
    contar()
    const intervalo = window.setInterval(contar, INTERVALO_MS)
    const subscricao = supabase
      .channel(`pedidos-sinistro-${canal}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos_sinistro' }, () => { contar() })
      .subscribe()
    return () => {
      window.clearInterval(intervalo)
      supabase.removeChannel(subscricao)
    }
  }, [ativo, contar, canal])

  return ativo ? total : 0
}
