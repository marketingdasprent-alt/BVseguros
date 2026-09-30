import { describe, expect, it } from 'vitest'
import { apoliceSugerida, rotuloDetalhe, sugerirClientes } from '@/lib/pedidosSinistro'
import type { Apolice, Cliente, PedidoSinistro } from '@/lib/types'

const pedido = (over: Partial<PedidoSinistro> = {}): PedidoSinistro => ({
  id: 'p1', criado_em: '', atualizado_em: '', nome: 'Rita', email: 'Rita@Ex.pt', telefone: '+351 916 000 000', ramo: 'auto',
  numero_apolice: null, seguradora: null, data_ocorrencia: '2026-09-29', local: null, descricao: 'Colisão', detalhes: {},
  consentimento_em: '', estado: 'novo', cliente_id: null, sinistro_id: null, tratado_por: null, notas: null, ...over,
})
const cliente = (id: string, over: Partial<Cliente> = {}): Cliente => ({
  id, nome: id, nif: null, telefone: '910000000', email: null, morada: null, lead_origem_id: null, responsavel_id: null, criado_em: '', ...over,
})
const apolice = (id: string, clienteId: string, numero: string, ramo: Apolice['ramo'] = 'auto') =>
  ({ id, cliente_id: clienteId, numero_apolice: numero, ramo, seguradora: 'X', premio_anual: null, data_inicio: '2026-01-01', data_fim: null, estado: 'ativa', criado_em: '' }) as Apolice

describe('sugerirClientes', () => {
  it('encontra por email (sem maiúsculas) e por telefone (com ou sem +351)', () => {
    const r = sugerirClientes(pedido(), [cliente('a', { email: 'rita@ex.pt' }), cliente('b', { telefone: '916 000 000' }), cliente('c')], [])
    expect(r.map((s) => [s.cliente.id, s.motivos])).toEqual([['a', ['email']], ['b', ['telefone']]])
  })

  it('o nº de apólice passa à frente de um contacto igual', () => {
    const r = sugerirClientes(pedido({ numero_apolice: 'ap 1' }), [cliente('a', { email: 'rita@ex.pt' }), cliente('b')], [apolice('x', 'b', 'AP-1')])
    expect(r[0].cliente.id).toBe('b')
    expect(r[0].motivos).toEqual(['nº de apólice'])
  })

  it('sem nada em comum não sugere ninguém', () => {
    expect(sugerirClientes(pedido({ email: 'outra@ex.pt', telefone: '999999999' }), [cliente('a')], [])).toEqual([])
  })
})

describe('apoliceSugerida', () => {
  it('prefere a apólice com o nº indicado', () => {
    const a = [apolice('1', 'c', 'AP-1'), apolice('2', 'c', 'AP-2')]
    expect(apoliceSugerida(pedido({ numero_apolice: 'AP-2' }), a)?.id).toBe('2')
  })

  it('senão, a única do mesmo ramo; com várias do ramo não adivinha', () => {
    expect(apoliceSugerida(pedido(), [apolice('1', 'c', 'A', 'vida'), apolice('2', 'c', 'B', 'auto')])?.id).toBe('2')
    expect(apoliceSugerida(pedido(), [apolice('1', 'c', 'A'), apolice('2', 'c', 'B')])).toBeNull()
  })
})

describe('rotuloDetalhe', () => {
  it('usa o rótulo do site e torna legível uma chave desconhecida', () => {
    expect(rotuloDetalhe('matricula')).toBe('Matrícula')
    expect(rotuloDetalhe('campo_novo')).toBe('Campo novo')
  })
})
