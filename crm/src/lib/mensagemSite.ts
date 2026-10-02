// Lê a mensagem que o formulário do site guarda em leads.mensagem (montarMensagem.ts
// na raiz): linha de resumo, blocos "[Título]" com "Rótulo: valor", e "Mensagem:" no fim.
// Também lê o formato anterior a 02/10/2026 (títulos com artigo, rótulos com "?").

export interface LinhaMensagem {
  rotulo: string
  valor: string
}

export interface BlocoMensagem {
  titulo: string
  linhas: LinhaMensagem[]
}

export interface MensagemSite {
  resumo?: string
  blocos: BlocoMensagem[]
  livre?: string
}

const TITULO = /^\[(.+)\]$/
const LINHA = /^([^:\n]{1,80}):\s+(.+)$/

function limparTitulo(titulo: string): string {
  const sem = titulo.trim().replace(/^(O|A|Os|As)\s+/, '')
  return sem.charAt(0).toUpperCase() + sem.slice(1)
}

const limparRotulo = (rotulo: string) => rotulo.trim().replace(/\?$/, '')

export function lerMensagemSite(texto: string | null | undefined): MensagemSite {
  const linhas = (texto ?? '').replace(/\r/g, '').split('\n')
  const blocos: BlocoMensagem[] = []
  let resumo: string | undefined
  let livre: string[] | null = null
  let atual: BlocoMensagem | null = null

  for (const [i, bruta] of linhas.entries()) {
    const linha = bruta.trim()
    if (livre) {
      livre.push(bruta)
      continue
    }
    if (linha === 'Mensagem:') {
      livre = []
      continue
    }
    if (!linha) continue

    const titulo = TITULO.exec(linha)
    if (titulo) {
      atual = { titulo: limparTitulo(titulo[1]), linhas: [] }
      blocos.push(atual)
      continue
    }
    if (i === 0 && linha.includes(' · ')) {
      resumo = linha
      continue
    }
    const par = LINHA.exec(linha)
    if (par) {
      // Linhas antes do primeiro bloco (o "Nível de proteção pretendido" do formato antigo).
      if (!atual) {
        atual = { titulo: 'Pedido', linhas: [] }
        blocos.push(atual)
      }
      atual.linhas.push({ rotulo: limparRotulo(par[1]), valor: par[2].trim() })
      continue
    }
    // Texto que não segue o padrão (lead criado à mão, mensagem antiga): fica como mensagem livre.
    return { resumo, blocos: [], livre: (texto ?? '').trim() }
  }

  const textoLivre = livre?.join('\n').trim()
  return { resumo, blocos: blocos.filter((b) => b.linhas.length > 0), livre: textoLivre || undefined }
}

/** Uma linha para o cartão do Kanban: o resumo sem o ramo (já está no badge), ou as primeiras respostas. */
export function resumoMensagem(texto: string | null | undefined, ramo?: string): string | null {
  const m = lerMensagemSite(texto)
  if (m.resumo) {
    const partes = m.resumo.split(' · ')
    const semRamo = ramo && partes[0] === ramo ? partes.slice(1) : partes
    return semRamo.join(' · ') || null
  }
  const valores = m.blocos.flatMap((b) => b.linhas.map((l) => l.valor)).slice(0, 2)
  if (valores.length) return valores.join(' · ')
  return m.livre ?? null
}

// Valores que o mediador costuma colar noutro sítio (simuladores das seguradoras).
const COPIAVEIS = new Set(['Matrícula', 'NIF', 'NIPC', 'Código postal'])

export function copiavel(linha: LinhaMensagem): boolean {
  return COPIAVEIS.has(linha.rotulo) && linha.valor !== 'Sem matrícula'
}
