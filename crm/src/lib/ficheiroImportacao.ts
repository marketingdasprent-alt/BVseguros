import { lerCsv } from '@/lib/csv'
import { chaveCabecalho, COLUNAS_OBRIGATORIAS, MODELOS, type TipoImportacao } from '@/lib/importacao'
import { montarTabelaPdf, type TextoPdf } from '@/lib/tabelaPdf'
import { ESTADOS_APOLICE, RAMOS } from '@/lib/types'

// Tudo corre no browser: o ficheiro não sai do computador antes de se carregar em Importar.
// As bibliotecas de Excel e PDF só se descarregam quando são precisas.

export type FormatoFicheiro = 'xlsx' | 'csv' | 'pdf'
export const ACEITES = '.xlsx,.csv,.pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,application/pdf'

export function formatoDe(nome: string): FormatoFicheiro | null {
  const ext = /\.([a-z0-9]+)$/i.exec(nome)?.[1]?.toLowerCase()
  return ext === 'xlsx' || ext === 'csv' || ext === 'pdf' ? ext : null
}

const doisDigitos = (n: number) => String(n).padStart(2, '0')

// O Excel guarda datas como datas e valores como números: passam a texto no formato que a validação lê.
export function celulaParaTexto(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (v instanceof Date) return `${doisDigitos(v.getUTCDate())}/${doisDigitos(v.getUTCMonth() + 1)}/${v.getUTCFullYear()}`
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100)
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não'
  return String(v).trim()
}

async function lerXlsx(f: File): Promise<string[][]> {
  const { readSheet } = await import('read-excel-file/browser')
  const linhas = await readSheet(f)
  return linhas.map((l) => l.map(celulaParaTexto)).filter((l) => l.some((c) => c !== ''))
}

async function lerPdf(f: File, tipo: TipoImportacao): Promise<string[][]> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  const tarefa = pdfjs.getDocument({ data: new Uint8Array(await f.arrayBuffer()) })
  const doc = await tarefa.promise
  const itens: TextoPdf[] = []
  for (let p = 1; p <= doc.numPages; p++) {
    const conteudo = await (await doc.getPage(p)).getTextContent()
    for (const i of conteudo.items) {
      if (!('str' in i)) continue
      itens.push({ texto: i.str, x: i.transform[4], y: i.transform[5], largura: i.width, altura: i.height || Math.abs(i.transform[3]), pagina: p })
    }
  }
  await tarefa.destroy()
  if (!itens.some((i) => i.texto.trim())) {
    throw new Error('CONFLITO: Este PDF não tem texto (parece digitalizado). Use o PDF gerado a partir do modelo em Excel, ou o próprio Excel.')
  }
  const tabela = montarTabelaPdf(itens, chaveCabecalho, COLUNAS_OBRIGATORIAS[tipo])
  if (!tabela) throw new Error('CONFLITO: Não encontrámos as colunas do modelo neste PDF. Use o PDF gerado a partir do modelo em Excel.')
  return tabela
}

/** Lê o ficheiro escolhido e devolve a tabela (primeira linha = títulos). */
export async function lerFicheiro(f: File, tipo: TipoImportacao): Promise<string[][]> {
  const formato = formatoDe(f.name)
  if (formato === 'xlsx') return lerXlsx(f)
  if (formato === 'pdf') return lerPdf(f, tipo)
  return lerCsv(await f.text())
}

type Folhas = Parameters<typeof import('write-excel-file/browser').default>[0]

async function guardarXlsx(nome: string, folhas: Folhas) {
  const { default: writeXlsxFile } = await import('write-excel-file/browser')
  await writeXlsxFile(folhas).toFile(nome)
}

const titulo = (value: string) => ({ value, fontWeight: 'bold' as const })

/** Modelo em Excel: folha de dados só com os títulos (nada que se importe por engano) e folha de instruções. */
export async function descarregarModelo(tipo: TipoImportacao) {
  const m = MODELOS[tipo]
  const valores = tipo === 'clientes'
    ? ['NIF com 9 dígitos; telefone português ou com indicativo (+44…).', 'Email do responsável: o email de quem fica com o cliente no CRM. Vazio: fica consigo.']
    : [
      `Ramo: ${RAMOS.map((r) => r.rotulo).join(', ')}.`,
      `Estado: ${ESTADOS_APOLICE.map((e) => e.rotulo).join(', ')} (vazio: Ativa).`,
      'Datas em dd/mm/aaaa. Prémio em euros, ex.: 450,00.',
      'Importe primeiro os clientes: a apólice liga-se ao cliente pelo NIF.',
    ]
  await guardarXlsx(`modelo-${tipo}-bv-seguros.xlsx`, [
    {
      sheet: tipo === 'clientes' ? 'Clientes' : 'Apólices',
      data: [m.rotulos.map(titulo)],
      columns: m.larguras.map((width) => ({ width })),
      stickyRowsCount: 1,
      orientation: 'landscape',
    },
    {
      sheet: 'Instruções',
      data: [
        [titulo('Como preencher')],
        ['Uma linha por registo, a partir da linha 2 da primeira folha. Não mude os títulos das colunas.'],
        ['Obrigatórias: ' + COLUNAS_OBRIGATORIAS[tipo].map((c) => m.rotulos[m.cabecalho.indexOf(c)]).join(', ') + '.'],
        ...valores.map((v) => [v]),
        ['Para enviar em PDF: no Excel, Ficheiro, Guardar como, escolher PDF (a folha já está na horizontal).'],
        [''],
        [titulo('Exemplo de uma linha')],
        m.rotulos.map(titulo),
        m.exemplo,
      ],
      columns: m.larguras.map((width, i) => ({ width: i === 0 ? Math.max(width, 60) : width })),
    },
  ])
}

/** Relatório das linhas não importadas, também em Excel. */
export async function descarregarRelatorio(tipo: TipoImportacao, erros: { linha: number; mensagem: string }[]) {
  await guardarXlsx(`erros-importacao-${tipo}.xlsx`, [{
    sheet: 'Erros',
    data: [[titulo('Linha'), titulo('Problema')], ...erros.map((e) => [e.linha, e.mensagem])],
    columns: [{ width: 8 }, { width: 80 }],
    stickyRowsCount: 1,
  }])
}
