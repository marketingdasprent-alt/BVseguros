import { describe, expect, it } from 'vitest'
import { descreverAlteracoes, formatarValorCampo, type EntradaHistorico } from '@/lib/historico'
import { formatarMoeda } from '@/lib/format'

const nomes = (id: string) => ({ u1: 'Maria', u2: 'Nuno' })[id]
const entrada = (tabela: EntradaHistorico['tabela'], alteracoes: EntradaHistorico['alteracoes']): EntradaHistorico => ({
  id: 'h', tabela, registo_id: 'r', cliente_id: null, acao: 'alterado', resumo: 'X', alteracoes, autor_id: null, autor_nome: 'Admin', criado_em: '',
})

describe('descreverAlteracoes', () => {
  it('prémio em euros e estado pelo rótulo', () => {
    expect(descreverAlteracoes(entrada('apolices', {
      premio_anual: { antes: 450.5, depois: 500 },
      estado: { antes: 'ativa', depois: 'cancelada' },
    }), nomes)).toEqual([`prémio anual de ${formatarMoeda(450.5)} para ${formatarMoeda(500)}`, 'estado de Ativa para Cancelada'])
  })

  it('responsável pelo nome da pessoa, e "vazio" quando não havia', () => {
    expect(descreverAlteracoes(entrada('leads', { responsavel_id: { antes: null, depois: 'u1' } }), nomes)).toEqual(['responsável de vazio para Maria'])
  })

  it('ignora campos técnicos', () => {
    expect(descreverAlteracoes(entrada('leads', { consentimento_em: { antes: null, depois: '2026' } }), nomes)).toEqual([])
  })
})

describe('formatarValorCampo', () => {
  it('datas em dd/mm/aaaa, ramo pelo rótulo, texto longo cortado', () => {
    expect(formatarValorCampo('apolices', 'data_fim', '2026-12-31', nomes)).toBe('31/12/2026')
    expect(formatarValorCampo('apolices', 'ramo', 'auto', nomes)).toBe('Automóvel')
    expect(formatarValorCampo('leads', 'notas', 'a'.repeat(80), nomes)).toHaveLength(58)
  })
})
