import { normalizar } from '@/lib/pesquisa'

// Prazo de conservação antes de um registo aparecer na revisão (questionário ao cliente,
// ponto 7). Muda-se aqui quando a BV indicar o seu.
export const PRAZO_REVISAO_MESES = 12

type Registo = Record<string, unknown>

/** O que a função exportar_cliente devolve. */
export interface ExportacaoCliente {
  exportado_em: string
  cliente: Registo
  lead_origem: Registo | null
  apolices: Registo[]
  propostas: Registo[]
  renovacoes: Registo[]
  sinistros: Registo[]
  atividades: Registo[]
  pedidos_sinistro: Registo[]
  historico: Registo[]
}

const SECOES: [keyof Omit<ExportacaoCliente, 'exportado_em'>, string][] = [
  ['cliente', 'Cliente'], ['lead_origem', 'Lead de origem'], ['apolices', 'Apólices'], ['propostas', 'Propostas'],
  ['renovacoes', 'Renovações'], ['sinistros', 'Sinistros'], ['atividades', 'Atividades'],
  ['pedidos_sinistro', 'Pedidos de sinistro'], ['historico', 'Histórico'],
]

/** Registos com mais tempo do que isto desde a última alteração entram na revisão. */
export function limiteRevisao(agora: Date, meses: number = PRAZO_REVISAO_MESES): string {
  const limite = new Date(agora)
  limite.setMonth(limite.getMonth() - meses)
  return limite.toISOString()
}

export function mesesDesde(iso: string, agora: Date = new Date()): number {
  const d = new Date(iso)
  return Math.max(0, (agora.getFullYear() - d.getFullYear()) * 12 + agora.getMonth() - d.getMonth() - (agora.getDate() < d.getDate() ? 1 : 0))
}

const celula = (v: unknown): string => (v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v))

/** Uma folha por tipo de registo (só as que têm dados), com as colunas tal como estão na base. */
export function folhasExportacao(dados: ExportacaoCliente): { nome: string; linhas: string[][] }[] {
  return SECOES.flatMap(([chave, nome]) => {
    const valor = dados[chave]
    const registos = (Array.isArray(valor) ? valor : valor ? [valor] : []) as Registo[]
    if (registos.length === 0) return []
    const colunas = [...new Set(registos.flatMap((r) => Object.keys(r)))]
    return [{ nome, linhas: [colunas, ...registos.map((r) => colunas.map((c) => celula(r[c])))] }]
  })
}

/** "dados-ana-costa-2026-10-06": sem acentos nem espaços, para qualquer sistema de ficheiros. */
export function nomeFicheiroExportacao(nome: string, dataIso: string): string {
  const base = normalizar(nome).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cliente'
  return `dados-${base}-${dataIso}`
}
