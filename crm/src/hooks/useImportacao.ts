import { supabase } from '@/lib/supabase'
import type { ErroLinha, LinhaApolice, LinhaCliente, TipoImportacao } from '@/lib/importacao'

const TAMANHO_LOTE = 500

export interface ResultadoImportacao {
  inseridos: number
  ignorados: ErroLinha[]
}

// Motivos vindos da base de dados (sqlerrm) em linguagem de quem importa.
function traduzirMotivo(motivo: string): string {
  if (motivo.includes('ramo_check')) return 'ramo inválido'
  if (motivo.includes('estado_check')) return 'estado inválido'
  if (motivo.includes('nao_negativo')) return 'o valor não pode ser negativo'
  if (motivo.includes('nif_formato')) return 'NIF inválido'
  if (motivo.includes('duplicate key') || motivo.includes('unique')) return 'registo repetido'
  return motivo.replace(/^CONFLITO: /, '')
}

// Envia em lotes (a função SQL aceita até 500 linhas) e devolve os erros já com o nº da linha do ficheiro.
export async function importarLinhas(
  tipo: TipoImportacao,
  linhas: { linha: number; dados: LinhaCliente | LinhaApolice }[],
  aoProgredir?: (feitas: number) => void,
): Promise<ResultadoImportacao> {
  const funcao = tipo === 'clientes' ? 'importar_clientes' : 'importar_apolices'
  const resultado: ResultadoImportacao = { inseridos: 0, ignorados: [] }

  for (let i = 0; i < linhas.length; i += TAMANHO_LOTE) {
    const lote = linhas.slice(i, i + TAMANHO_LOTE)
    const { data, error } = await supabase.rpc(funcao, { p_linhas: lote.map((l) => l.dados) })
    if (error) throw error
    const r = data as { inseridos: number; ignorados: { indice: number; motivo: string }[] }
    resultado.inseridos += r.inseridos
    resultado.ignorados.push(...r.ignorados.map((ig) => ({ linha: lote[ig.indice].linha, mensagem: traduzirMotivo(ig.motivo) })))
    aoProgredir?.(Math.min(i + TAMANHO_LOTE, linhas.length))
  }
  return resultado
}
