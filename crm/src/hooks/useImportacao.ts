import { supabase } from '@/lib/supabase'
import type { ErroLinha, LinhaApolice, LinhaCliente, TipoImportacao } from '@/lib/importacao'

const TAMANHO_LOTE = 500
// Tipos que só a IA lê; CSV e texto vão como texto. 3 MB: limite do pedido na Vercel (api/ler-carteira.js).
const TIPOS_BINARIOS = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
export const MAX_BYTES_IA = 3 * 1024 * 1024

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

function paraBase64(ficheiro: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onload = () => resolve(String(leitor.result).split(',', 2)[1] ?? '')
    leitor.onerror = () => reject(new Error('Não foi possível abrir o ficheiro.'))
    leitor.readAsDataURL(ficheiro)
  })
}

// Pede ao Gemini (via api/ler-carteira.js) as linhas do documento, já nas colunas do modelo.
// Devolve um CSV para seguir exatamente a mesma validação de um ficheiro escolhido à mão.
export async function lerComIA(tipo: TipoImportacao, ficheiro: File): Promise<string[][]> {
  if (ficheiro.size > MAX_BYTES_IA) throw new Error('CONFLITO: O ficheiro tem mais de 3 MB. Divida-o em partes.')
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('CONFLITO: A sessão expirou. Inicie sessão novamente.')

  const binario = TIPOS_BINARIOS.includes(ficheiro.type)
  const corpoPedido = binario
    ? { tipo, mimeType: ficheiro.type, dados: await paraBase64(ficheiro) }
    : { tipo, texto: await ficheiro.text() }
  const resposta = await fetch('/api/ler-carteira', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(corpoPedido),
  })
  const corpo = (await resposta.json().catch(() => ({}))) as { colunas?: string[]; linhas?: string[][]; error?: string }
  if (!resposta.ok || !corpo.colunas || !corpo.linhas) throw new Error(`CONFLITO: ${corpo.error ?? 'Não foi possível ler o documento com IA.'}`)
  return [corpo.colunas, ...corpo.linhas]
}
