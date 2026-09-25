import type { Apolice, Sinistro } from '@/lib/types'

export interface ResumoCliente {
  apolicesAtivas: number
  premioAnualTotal: number
  sinistrosEmAberto: number
  proximaRenovacao: Apolice | null
}

const SINISTRO_FECHADO: Sinistro['estado'][] = ['pago', 'recusado']

// Números da faixa de métricas da ficha. hoje em "aaaa-mm-dd" (dataLocalIso).
export function resumirCliente(apolices: Apolice[], sinistros: Sinistro[], hoje: string): ResumoCliente {
  const ativas = apolices.filter((a) => a.estado === 'ativa')
  const proxima = ativas
    .filter((a) => a.data_fim && a.data_fim >= hoje)
    .sort((a, b) => (a.data_fim as string).localeCompare(b.data_fim as string))[0] ?? null
  return {
    apolicesAtivas: ativas.length,
    premioAnualTotal: ativas.reduce((soma, a) => soma + (a.premio_anual ?? 0), 0),
    sinistrosEmAberto: sinistros.filter((s) => !SINISTRO_FECHADO.includes(s.estado)).length,
    proximaRenovacao: proxima,
  }
}
