// Reconstrói a tabela do modelo a partir do texto de um PDF (Excel → Guardar como PDF).
// Um PDF não tem células: só pedaços de texto com posição. Junta-os em linhas pela altura
// e em colunas pela posição dos títulos do cabeçalho.

export interface TextoPdf {
  texto: string
  x: number
  y: number
  largura: number
  altura: number
  pagina: number
}

interface Segmento { texto: string; x: number; fim: number; pagina: number }

const MESMA_LINHA = 3
const NUMERO_PAGINA = /^(p[aá]gina|page)?\s*\d+(\s*(de|of|\/)\s*\d+)?$/i

// Pedaços na mesma altura formam uma linha; pedaços colados (palavras da mesma célula) juntam-se.
function linhasDe(itens: TextoPdf[]): Segmento[][] {
  const ordenados = itens
    .filter((i) => i.texto.trim() !== '')
    .sort((a, b) => a.pagina - b.pagina || b.y - a.y || a.x - b.x)
  const linhas: TextoPdf[][] = []
  for (const item of ordenados) {
    const atual = linhas[linhas.length - 1]
    if (atual && atual[0].pagina === item.pagina && Math.abs(atual[0].y - item.y) <= MESMA_LINHA) atual.push(item)
    else linhas.push([item])
  }
  return linhas.map((linha) => {
    const segs: Segmento[] = []
    for (const i of linha.sort((a, b) => a.x - b.x)) {
      const ultimo = segs[segs.length - 1]
      // Um espaço normal mede cerca de 1/3 da altura da letra; mais do que isso é outra célula.
      if (ultimo && i.x - ultimo.fim <= Math.max(i.altura * 0.6, 2)) {
        ultimo.texto += (i.x - ultimo.fim > 0.5 ? ' ' : '') + i.texto.trim()
        ultimo.fim = i.x + i.largura
      } else segs.push({ texto: i.texto.trim(), x: i.x, fim: i.x + i.largura, pagina: i.pagina })
    }
    return segs
  })
}

/**
 * Devolve [títulos, ...linhas] alinhadas às colunas do cabeçalho, ou null se nenhuma linha
 * tiver as colunas obrigatórias. `chave` traduz um título para a chave do modelo.
 */
export function montarTabelaPdf(itens: TextoPdf[], chave: (titulo: string) => string, obrigatorias: string[]): string[][] | null {
  const linhas = linhasDe(itens)
  const eCabecalho = (l: Segmento[]) => {
    const chaves = l.map((s) => chave(s.texto))
    return obrigatorias.every((o) => chaves.includes(o))
  }
  const inicio = linhas.findIndex(eCabecalho)
  if (inicio === -1) return null

  const cabecalho = linhas[inicio]
  const titulos = cabecalho.map((s) => s.texto)
  // Cada coluna começa um pouco antes do seu título (números e datas vêm alinhados à direita, por isso ficam sempre depois).
  const inicios = cabecalho.map((s) => s.x - MESMA_LINHA)
  const tabela: string[][] = [titulos]

  // Páginas que repetem o cabeçalho: o que está acima dele (título, cabeçalho de impressão) não é tabela.
  const cabecalhoPorPagina = new Map<number, number>()
  linhas.forEach((l, i) => { if (eCabecalho(l) && !cabecalhoPorPagina.has(l[0].pagina)) cabecalhoPorPagina.set(l[0].pagina, i) })

  for (const [i, linha] of linhas.entries()) {
    if (i <= inicio) continue
    if (i <= (cabecalhoPorPagina.get(linha[0].pagina) ?? -1)) continue
    if (linha.length === 1 && NUMERO_PAGINA.test(linha[0].texto)) continue
    const celulas: string[] = titulos.map(() => '')
    for (const s of linha) {
      let col = 0
      inicios.forEach((x, i) => { if (s.x >= x) col = i })
      celulas[col] = celulas[col] ? `${celulas[col]} ${s.texto}` : s.texto
    }
    // Sem a primeira coluna é o resto de uma célula que passou para a linha de baixo.
    const anterior = tabela[tabela.length - 1]
    if (!celulas[0] && tabela.length > 1) {
      celulas.forEach((c, i) => { if (c) anterior[i] = anterior[i] ? `${anterior[i]} ${c}` : c })
    } else tabela.push(celulas)
  }
  return tabela
}
