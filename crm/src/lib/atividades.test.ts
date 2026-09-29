import { describe, expect, it } from 'vitest'
import { resumirAtividadesPorLead } from '@/lib/atividades'
import type { Atividade } from '@/lib/types'

const atividade = (dados: Partial<Atividade>): Atividade => ({
  id: crypto.randomUUID(), tipo: 'tarefa', titulo: 'x', notas: null, lead_id: 'L1', cliente_id: null, responsavel_id: null,
  concluida: false, data_prevista: null, data_atividade: '2026-09-01T10:00:00Z', criado_em: '2026-09-01T10:00:00Z', ...dados,
})

describe('resumirAtividadesPorLead', () => {
  it('conta as atividades de cada lead e ignora as sem lead', () => {
    const r = resumirAtividadesPorLead([atividade({ tipo: 'chamada' }), atividade({ tipo: 'nota' }), atividade({ lead_id: null })])
    expect(r.get('L1')?.total).toBe(2)
    expect(r.size).toBe(1)
  })

  it('escolhe a tarefa por concluir com o prazo mais próximo', () => {
    const r = resumirAtividadesPorLead([
      atividade({ titulo: 'sem prazo' }),
      atividade({ titulo: 'dia 10', data_prevista: '2026-10-10' }),
      atividade({ titulo: 'dia 5', data_prevista: '2026-10-05' }),
      atividade({ titulo: 'feita', data_prevista: '2026-10-01', concluida: true }),
      atividade({ titulo: 'chamada', tipo: 'chamada', data_prevista: '2026-09-01' }),
    ])
    expect(r.get('L1')?.proximaTarefa?.titulo).toBe('dia 5')
  })

  it('usa uma tarefa sem prazo quando não há outra', () => {
    const r = resumirAtividadesPorLead([atividade({ titulo: 'sem prazo' }), atividade({ titulo: 'feita', concluida: true })])
    expect(r.get('L1')?.proximaTarefa?.titulo).toBe('sem prazo')
  })
})
