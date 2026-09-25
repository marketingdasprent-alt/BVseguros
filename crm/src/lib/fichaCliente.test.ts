import { describe, expect, it } from 'vitest'
import { resumirCliente } from '@/lib/fichaCliente'
import type { Apolice, Sinistro } from '@/lib/types'

const apolice = (p: Partial<Apolice>): Apolice => ({
  id: p.numero_apolice ?? 'x', cliente_id: 'c', numero_apolice: 'x', ramo: 'auto', seguradora: 'S',
  premio_anual: null, data_inicio: '2026-01-01', data_fim: null, estado: 'ativa', criado_em: '', ...p,
})
const sinistro = (estado: Sinistro['estado']): Sinistro => ({
  id: estado, apolice_id: 'x', numero_sinistro: null, data_ocorrencia: '2026-01-01', descricao: 'd',
  estado, valor_estimado: null, valor_pago: null, notas: null, criado_em: '', atualizado_em: '',
})

describe('resumirCliente', () => {
  it('conta só as apólices ativas e soma os prémios delas', () => {
    const r = resumirCliente([
      apolice({ numero_apolice: 'A', premio_anual: 300 }),
      apolice({ numero_apolice: 'B', premio_anual: 200.5 }),
      apolice({ numero_apolice: 'C', premio_anual: 999, estado: 'cancelada' }),
    ], [], '2026-09-25')
    expect(r.apolicesAtivas).toBe(2)
    expect(r.premioAnualTotal).toBe(500.5)
  })

  it('sinistros pagos ou recusados não estão em aberto', () => {
    expect(resumirCliente([], [sinistro('participado'), sinistro('em_analise'), sinistro('pago'), sinistro('recusado')], '2026-09-25').sinistrosEmAberto).toBe(2)
  })

  it('próxima renovação = apólice ativa com o fim mais próximo a partir de hoje', () => {
    const r = resumirCliente([
      apolice({ numero_apolice: 'passada', data_fim: '2026-09-01' }),
      apolice({ numero_apolice: 'longe', data_fim: '2027-05-01' }),
      apolice({ numero_apolice: 'perto', data_fim: '2026-10-10' }),
      apolice({ numero_apolice: 'cancelada', data_fim: '2026-09-30', estado: 'cancelada' }),
    ], [], '2026-09-25')
    expect(r.proximaRenovacao?.numero_apolice).toBe('perto')
  })

  it('sem apólices, tudo a zero', () => {
    expect(resumirCliente([], [], '2026-09-25')).toEqual({ apolicesAtivas: 0, premioAnualTotal: 0, sinistrosEmAberto: 0, proximaRenovacao: null })
  })
})
