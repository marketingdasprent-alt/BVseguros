import type { Atividade } from '@/lib/types'

export interface ResumoAtividadesLead {
  total: number
  // A tarefa por concluir com o prazo mais próximo (sem prazo fica para o fim).
  proximaTarefa: Atividade | null
}

export function resumirAtividadesPorLead(atividades: Atividade[]): Map<string, ResumoAtividadesLead> {
  const porLead = new Map<string, ResumoAtividadesLead>()
  for (const a of atividades) {
    if (!a.lead_id) continue
    const resumo = porLead.get(a.lead_id) ?? { total: 0, proximaTarefa: null }
    resumo.total += 1
    if (a.tipo === 'tarefa' && !a.concluida && antes(a, resumo.proximaTarefa)) resumo.proximaTarefa = a
    porLead.set(a.lead_id, resumo)
  }
  return porLead
}

function antes(a: Atividade, atual: Atividade | null): boolean {
  if (!atual) return true
  if (!a.data_prevista) return false
  return !atual.data_prevista || a.data_prevista < atual.data_prevista
}
