import { describe, expect, it } from 'vitest'
import { folhasExportacao, limiteRevisao, mesesDesde, nomeFicheiroExportacao, type ExportacaoCliente } from '@/lib/rgpd'

const dados: ExportacaoCliente = {
  exportado_em: '2026-10-06T10:00:00Z',
  cliente: { id: 'c1', nome: 'Ana Costa', nif: '123456789', morada: null },
  lead_origem: null,
  apolices: [{ numero_apolice: 'AP-1', premio_anual: 300 }, { numero_apolice: 'AP-2', premio_anual: null, extra: true }],
  propostas: [], renovacoes: [], sinistros: [], atividades: [], pedidos_sinistro: [],
  historico: [{ acao: 'alterado', alteracoes: { morada: { antes: 'A', depois: 'B' } } }],
}

describe('RGPD', () => {
  it('uma folha por tipo com dados; vazios e nulos ficam de fora ou em branco', () => {
    const folhas = folhasExportacao(dados)
    expect(folhas.map((f) => f.nome)).toEqual(['Cliente', 'Apólices', 'Histórico'])
    expect(folhas[0].linhas).toEqual([['id', 'nome', 'nif', 'morada'], ['c1', 'Ana Costa', '123456789', '']])
    expect(folhas[1].linhas).toEqual([['numero_apolice', 'premio_anual', 'extra'], ['AP-1', '300', ''], ['AP-2', '', 'true']])
    expect(folhas[2].linhas[1][1]).toBe('{"morada":{"antes":"A","depois":"B"}}')
  })

  it('prazo: limite e meses decorridos', () => {
    expect(limiteRevisao(new Date(2026, 9, 6, 12), 12)).toBe(new Date(2025, 9, 6, 12).toISOString())
    expect(mesesDesde(new Date(2025, 9, 6).toISOString(), new Date(2026, 9, 6))).toBe(12)
    expect(mesesDesde(new Date(2025, 9, 7).toISOString(), new Date(2026, 9, 6))).toBe(11)
  })

  it('nome do ficheiro sem acentos nem espaços', () => {
    expect(nomeFicheiroExportacao('João  Sá, Lda.', '2026-10-06')).toBe('dados-joao-sa-lda-2026-10-06')
    expect(nomeFicheiroExportacao('***', '2026-10-06')).toBe('dados-cliente-2026-10-06')
  })
})
