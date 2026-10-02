import { describe, expect, it } from 'vitest'
import { copiavel, lerMensagemSite, resumoMensagem } from '@/lib/mensagemSite'

const NOVO = `Automóvel · BT-84-HL · Essencial

[Veículo]
Matrícula: BT-84-HL
Tipo: Ligeiro

[Quem pede]
NIF: 338437517
Código postal: 2410-232 Pousos, Leiria

Mensagem:
Liguem depois das 18h.
Obrigado: Ana`

// O pedido real de 01/10/2026, guardado no formato antigo.
const ANTIGO = `[A matrícula]
Matrícula: BT-84-HL
[O veículo]
Veículo importado?: Não
[Contacto]
NIF: 338437517`

describe('lerMensagemSite', () => {
  it('lê o formato novo: resumo, blocos e mensagem livre (com ":" lá dentro)', () => {
    const m = lerMensagemSite(NOVO)
    expect(m.resumo).toBe('Automóvel · BT-84-HL · Essencial')
    expect(m.blocos).toEqual([
      { titulo: 'Veículo', linhas: [{ rotulo: 'Matrícula', valor: 'BT-84-HL' }, { rotulo: 'Tipo', valor: 'Ligeiro' }] },
      { titulo: 'Quem pede', linhas: [{ rotulo: 'NIF', valor: '338437517' }, { rotulo: 'Código postal', valor: '2410-232 Pousos, Leiria' }] },
    ])
    expect(m.livre).toBe('Liguem depois das 18h.\nObrigado: Ana')
  })

  it('lê o formato antigo: tira artigos dos títulos e o "?" dos rótulos', () => {
    const m = lerMensagemSite(ANTIGO)
    expect(m.resumo).toBeUndefined()
    expect(m.blocos.map((b) => b.titulo)).toEqual(['Matrícula', 'Veículo', 'Contacto'])
    expect(m.blocos[1].linhas[0]).toEqual({ rotulo: 'Veículo importado', valor: 'Não' })
  })

  it('linhas antes do primeiro bloco (nível do formato antigo) ficam num bloco "Pedido"', () => {
    const m = lerMensagemSite('Nível de proteção pretendido: Completo\n[A proteção]\nNível de proteção: Proteção completa')
    expect(m.blocos[0]).toEqual({ titulo: 'Pedido', linhas: [{ rotulo: 'Nível de proteção pretendido', valor: 'Completo' }] })
  })

  it('texto sem o padrão fica todo como mensagem livre', () => {
    const m = lerMensagemSite('Olá, queria um seguro para o barco.\nSou de Leiria.')
    expect(m.blocos).toEqual([])
    expect(m.livre).toBe('Olá, queria um seguro para o barco.\nSou de Leiria.')
  })

  it('vazio', () => {
    expect(lerMensagemSite(null)).toEqual({ resumo: undefined, blocos: [], livre: undefined })
  })
})

describe('resumoMensagem', () => {
  it('tira o ramo, que o cartão já mostra no badge', () => {
    expect(resumoMensagem(NOVO, 'Automóvel')).toBe('BT-84-HL · Essencial')
  })
  it('formato antigo: as duas primeiras respostas', () => {
    expect(resumoMensagem(ANTIGO, 'Automóvel')).toBe('BT-84-HL · Não')
  })
  it('texto livre fica como está', () => {
    expect(resumoMensagem('Liguem-me.')).toBe('Liguem-me.')
  })
})

describe('copiavel', () => {
  it('matrícula, NIF, NIPC e código postal; "Sem matrícula" não', () => {
    expect(copiavel({ rotulo: 'NIF', valor: '1' })).toBe(true)
    expect(copiavel({ rotulo: 'Matrícula', valor: 'Sem matrícula' })).toBe(false)
    expect(copiavel({ rotulo: 'Tipo', valor: 'Ligeiro' })).toBe(false)
  })
})
