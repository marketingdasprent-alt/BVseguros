import { describe, expect, it } from 'vitest'
import { escreverCsv, lerCsv } from '@/lib/csv'
import { celulaParaTexto } from '@/lib/ficheiroImportacao'
import { chaveCabecalho, lerData, lerImportacao, lerValor, MODELOS, nifValido } from '@/lib/importacao'

describe('celulaParaTexto (Excel)', () => {
  it('datas, números e vazios no formato que a validação lê', () => {
    expect(celulaParaTexto(new Date(Date.UTC(2026, 0, 31)))).toBe('31/01/2026')
    expect(celulaParaTexto(912345678)).toBe('912345678')
    expect(celulaParaTexto(450.5)).toBe('450.5')
    expect(celulaParaTexto(null)).toBe('')
    expect(celulaParaTexto('  Ana  ')).toBe('Ana')
  })
})

describe('lerCsv', () => {
  it('lê o formato do Excel PT: ";" , BOM, CRLF e aspas', () => {
    const csv = '﻿nome;morada\r\n"Silva; Lda";"Rua ""A"", 1"\r\n\r\n'
    expect(lerCsv(csv)).toEqual([['nome', 'morada'], ['Silva; Lda', 'Rua "A", 1']])
  })

  it('também lê com vírgulas', () => {
    expect(lerCsv('a,b\n1,2')).toEqual([['a', 'b'], ['1', '2']])
  })

  it('o que escreve volta a ler igual', () => {
    const dados = [['nome', 'nota'], ['Ana', 'diz "olá"; adeus']]
    expect(lerCsv(escreverCsv(dados))).toEqual(dados)
  })
})

describe('validações', () => {
  it('NIF com dígito de controlo', () => {
    expect(nifValido('123456789')).toBe(true)
    expect(nifValido('501964843')).toBe(true)
    expect(nifValido('123456780')).toBe(false)
    expect(nifValido('12345678')).toBe(false)
    expect(nifValido('423456789')).toBe(false)
  })

  it('datas em PT e ISO, e rejeita datas impossíveis', () => {
    expect(lerData('01/02/2026')).toBe('2026-02-01')
    expect(lerData('2026-2-1')).toBe('2026-02-01')
    expect(lerData('31/02/2026')).toBeNull()
    expect(lerData('amanhã')).toBeNull()
  })

  it('valores em formato PT e internacional', () => {
    expect(lerValor('1.234,56 €')).toBe(1234.56)
    expect(lerValor('450,5')).toBe(450.5)
    expect(lerValor('1234.56')).toBe(1234.56)
    expect(lerValor('1.200')).toBe(1200)
    expect(lerValor('')).toBeNull()
    expect(lerValor('abc')).toBeNaN()
  })
})

describe('lerImportacao', () => {
  it('clientes: separa válidas de erros e aponta a linha do Excel', () => {
    const csv = [
      'Nome;Telemóvel;E-mail;Contribuinte;Morada',
      'Ana Costa;912 345 678;ana@x.pt;123456789;Lisboa',
      'Bruno;91234;;;',
      'Carla;912345678;;123456780;',
      'Duarte;912345678;;123456789;',
    ].join('\n')
    const r = lerImportacao('clientes', csv)
    expect(r.validas.map((v) => v.dados.nome)).toEqual(['Ana Costa'])
    expect(r.validas[0].dados.telefone).toBe('912345678')
    expect(r.erros).toEqual([
      { linha: 3, mensagem: 'telefone inválido' },
      { linha: 4, mensagem: 'NIF 123456780 inválido' },
      { linha: 5, mensagem: 'NIF 123456789 repetido no ficheiro' },
    ])
  })

  it('apólices: ramo e estado por rótulo, datas e valores PT', () => {
    const csv = 'nif;apolice;ramo;companhia;premio;inicio;fim;estado\n123456789;AP-1;Automóvel;Fidelidade;"1.234,50";01/01/2026;31/12/2026;Ativa'
    const r = lerImportacao('apolices', csv)
    expect(r.erros).toEqual([])
    expect(r.validas[0].dados).toEqual({
      nif_cliente: '123456789', numero_apolice: 'AP-1', ramo: 'auto', seguradora: 'Fidelidade',
      premio_anual: 1234.5, data_inicio: '2026-01-01', data_fim: '2026-12-31', estado: 'ativa',
    })
  })

  it('apólices: junta todos os problemas da linha numa mensagem', () => {
    const r = lerImportacao('apolices', 'nif_cliente;numero_apolice;ramo;seguradora;data_inicio\n1;;Barcos;;ontem')
    expect(r.erros[0].mensagem).toBe('NIF do cliente 1 inválido; nº de apólice em falta; ramo "Barcos" desconhecido; seguradora em falta; data de início "ontem" inválida')
  })

  it('lê a tabela do modelo em Excel pelos títulos legíveis', () => {
    const tabela = [MODELOS.apolices.rotulos, ['123456789', 'AP-9', 'Vida', 'Ageas', '120', '01/03/2026', '', '']]
    const r = lerImportacao('apolices', tabela)
    expect(r.erros).toEqual([])
    expect(r.validas[0].dados).toMatchObject({ numero_apolice: 'AP-9', ramo: 'vida', premio_anual: 120, estado: 'ativa' })
    expect(MODELOS.clientes.rotulos.map(chaveCabecalho)).toEqual(MODELOS.clientes.cabecalho)
    expect(MODELOS.apolices.rotulos.map(chaveCabecalho)).toEqual(MODELOS.apolices.cabecalho)
  })

  it('avisa das colunas em falta em vez de dar erro em todas as linhas', () => {
    const r = lerImportacao('clientes', 'nome;email\nAna;a@x.pt')
    expect(r.erros).toEqual([{ linha: 1, mensagem: 'Faltam as colunas: telefone. Use o modelo.' }])
  })
})
