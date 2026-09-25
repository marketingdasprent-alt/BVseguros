import { useCallback, useEffect, useId, useState } from 'react'
import { supabase } from '@/lib/supabase'

const INTERVALO_MS = 60_000

// Pedidos do site ainda por tratar: em "Novo" e sem responsável. Atualiza por Realtime
// e, se o Realtime não estiver ligado ao projeto, a cada minuto na mesma.
export function useLeadsPorTratar() {
  const [total, setTotal] = useState(0)
  const canal = useId()

  const contar = useCallback(async () => {
    const { count, error } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('origem', 'site')
      .eq('estado', 'novo')
      .is('responsavel_id', null)
    // Um contador falhado não deve estragar a navegação: fica o último valor.
    if (error) console.warn('Não foi possível contar os leads por tratar:', error.message)
    else setTotal(count ?? 0)
  }, [])

  useEffect(() => {
    contar()
    const intervalo = window.setInterval(contar, INTERVALO_MS)
    const subscricao = supabase
      .channel(`leads-por-tratar-${canal}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => { contar() })
      .subscribe()
    return () => {
      window.clearInterval(intervalo)
      supabase.removeChannel(subscricao)
    }
  }, [contar, canal])

  return total
}
