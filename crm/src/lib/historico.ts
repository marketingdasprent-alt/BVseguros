import { formatarData, formatarMoeda } from '@/lib/format'
import { ESTADOS_APOLICE, ESTADOS_LEAD, ESTADOS_PROPOSTA, ESTADOS_RENOVACAO, ESTADOS_SINISTRO, RAMOS } from '@/lib/types'

export interface EntradaHistorico {
  id: string
  tabela: 'leads' | 'clientes' | 'apolices' | 'propostas' | 'sinistros' | 'renovacoes'
  registo_id: string
  cliente_id: string | null
  acao: 'criado' | 'alterado' | 'apagado'
  resumo: string | null
  alteracoes: Record<string, { antes: unknown; depois: unknown }> | null
  autor_id: string | null
  autor_nome: string | null
  criado_em: string
}

// Artigo + nome, para frases como "criou a apólice AP-1".
export const NOME_TABELA: Record<EntradaHistorico['tabela'], string> = {
  leads: 'o lead', clientes: 'o cliente', apolices: 'a apólice', propostas: 'a proposta', sinistros: 'o sinistro', renovacoes: 'a renovação',
}

const ROTULO_CAMPO: Record<string, string> = {
  nome: 'nome', telefone: 'telefone', email: 'email', nif: 'NIF', morada: 'morada', notas: 'notas',
  ramo: 'ramo', ramo_interesse: 'ramo', seguradora: 'seguradora', numero_apolice: 'nº de apólice',
  premio_anual: 'prémio anual', premio_anual_estimado: 'prémio estimado', data_inicio: 'data de início',
  data_fim: 'data de fim', estado: 'estado', responsavel_id: 'responsável', coberturas: 'coberturas',
  numero_sinistro: 'nº do sinistro', data_ocorrencia: 'data de ocorrência', descricao: 'descrição',
  valor_estimado: 'valor estimado', valor_pago: 'valor pago', cliente_id: 'cliente', lead_id: 'lead',
  lead_origem_id: 'lead de origem', data_fim_anterior: 'fim anterior', mensagem: 'mensagem',
}

// Campos técnicos que não interessam a quem lê (mudam sozinhos ou são ids internos).
const IGNORAR = new Set(['id', 'consentimento_em', 'origem'])

const ESTADOS: Partial<Record<EntradaHistorico['tabela'], { valor: string; rotulo: string }[]>> = {
  leads: ESTADOS_LEAD, apolices: ESTADOS_APOLICE, propostas: ESTADOS_PROPOSTA, sinistros: ESTADOS_SINISTRO, renovacoes: ESTADOS_RENOVACAO,
}

export function formatarValorCampo(tabela: EntradaHistorico['tabela'], campo: string, valor: unknown, nomePessoa: (id: string) => string | undefined): string {
  if (valor === null || valor === undefined || valor === '') return 'vazio'
  if (campo === 'responsavel_id') return nomePessoa(String(valor)) ?? 'outra pessoa'
  if (campo === 'estado') return ESTADOS[tabela]?.find((e) => e.valor === valor)?.rotulo ?? String(valor)
  if (campo === 'ramo' || campo === 'ramo_interesse') return RAMOS.find((r) => r.valor === valor)?.rotulo ?? String(valor)
  if (/^(premio|valor)/.test(campo)) return formatarMoeda(Number(valor))
  if (/^data_/.test(campo) && typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)) return formatarData(valor)
  const texto = String(valor)
  return texto.length > 60 ? `${texto.slice(0, 57)}…` : texto
}

// "prémio anual de 450,50 € para 500,00 €", uma por campo alterado.
export function descreverAlteracoes(entrada: EntradaHistorico, nomePessoa: (id: string) => string | undefined): string[] {
  return Object.entries(entrada.alteracoes ?? {})
    .filter(([campo]) => !IGNORAR.has(campo))
    .map(([campo, { antes, depois }]) =>
      `${ROTULO_CAMPO[campo] ?? campo.replace(/_/g, ' ')} de ${formatarValorCampo(entrada.tabela, campo, antes, nomePessoa)} para ${formatarValorCampo(entrada.tabela, campo, depois, nomePessoa)}`)
}
