import { describe, expect, it } from 'vitest'
import { chaveCabecalho, COLUNAS_OBRIGATORIAS, lerImportacao } from '@/lib/importacao'
import { montarTabelaPdf, type TextoPdf } from '@/lib/tabelaPdf'

// Texto como o pdf.js o devolve de uma folha do modelo guardada em PDF (y cresce para cima).
const t = (texto: string, x: number, y: number, pagina = 1): TextoPdf => ({ texto, x, y, largura: texto.length * 5, altura: 10, pagina })
const montar = (itens: TextoPdf[]) => montarTabelaPdf(itens, chaveCabecalho, COLUNAS_OBRIGATORIAS.apolices)

const cabecalho = (y: number, pagina = 1) => [
  t('BV Seguros', 40, y + 40, pagina), // título acima da tabela: ignorado
  t('NIF do cliente', 40, y, pagina), t('Nº da', 120, y, pagina), t('apólice', 146, y, pagina),
  t('Ramo', 200, y, pagina), t('Seguradora', 300, y, pagina), t('Prémio anual (€)', 400, y, pagina),
  t('Data de início', 500, y, pagina),
]

describe('montarTabelaPdf', () => {
  it('reconstrói as colunas pelo cabeçalho, com números à direita e várias páginas', () => {
    const itens = [
      ...cabecalho(700),
      t('123456789', 40, 685), t('AP-1', 120, 685), t('Automóvel', 200, 685), t('Fidelidade', 300, 685), t('450,5', 450, 685), t('01/01/2026', 520, 685),
      t('1', 300, 30), // número da página
      ...cabecalho(700, 2),
      t('501964843', 40, 685, 2), t('AP-2', 120, 685, 2), t('Vida', 200, 685, 2), t('Ageas', 300, 685, 2), t('01/02/2026', 520, 685, 2),
    ]
    expect(montar(itens)).toEqual([
      ['NIF do cliente', 'Nº da apólice', 'Ramo', 'Seguradora', 'Prémio anual (€)', 'Data de início'],
      ['123456789', 'AP-1', 'Automóvel', 'Fidelidade', '450,5', '01/01/2026'],
      ['501964843', 'AP-2', 'Vida', 'Ageas', '', '01/02/2026'],
    ])
  })

  it('junta à linha de cima o texto que passou para a linha seguinte da célula', () => {
    const itens = [...cabecalho(700), t('123456789', 40, 685), t('AP-1', 120, 685), t('Multirriscos', 200, 685), t('habitação', 200, 675), t('X', 300, 685), t('01/01/2026', 520, 685)]
    expect(montar(itens)?.[1][2]).toBe('Multirriscos habitação')
  })

  it('sem as colunas do modelo devolve null', () => {
    expect(montar([t('Listagem', 40, 700), t('Cliente', 40, 680)])).toBeNull()
  })

  it('a tabela do PDF passa pela mesma validação', () => {
    const tabela = montar([...cabecalho(700), t('123456789', 40, 685), t('AP-1', 120, 685), t('Automóvel', 200, 685), t('Fidelidade', 300, 685), t('1.234,50', 440, 685), t('01/01/2026', 520, 685)])!
    const r = lerImportacao('apolices', tabela)
    expect(r.erros).toEqual([])
    expect(r.validas[0].dados).toMatchObject({ numero_apolice: 'AP-1', ramo: 'auto', premio_anual: 1234.5, data_inicio: '2026-01-01' })
  })
})
