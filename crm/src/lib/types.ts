export type EstadoLead = 'novo' | 'contactado' | 'proposta_enviada' | 'convertido' | 'perdido'

export const ESTADOS_LEAD: { valor: EstadoLead; rotulo: string }[] = [
  { valor: 'novo', rotulo: 'Novo' },
  { valor: 'contactado', rotulo: 'Contactado' },
  { valor: 'proposta_enviada', rotulo: 'Proposta enviada' },
  { valor: 'convertido', rotulo: 'Convertido' },
  { valor: 'perdido', rotulo: 'Perdido' },
]

export type Ramo = 'auto' | 'vida' | 'saude' | 'multirriscos' | 'acidentes_trabalho' | 'outro'

export const RAMOS: { valor: Ramo; rotulo: string }[] = [
  { valor: 'auto', rotulo: 'Automóvel' },
  { valor: 'vida', rotulo: 'Vida' },
  { valor: 'saude', rotulo: 'Saúde' },
  { valor: 'multirriscos', rotulo: 'Multirriscos habitação' },
  { valor: 'acidentes_trabalho', rotulo: 'Acidentes de trabalho' },
  { valor: 'outro', rotulo: 'Outro' },
]

export type OrigemLead = 'manual' | 'site'

export interface Lead {
  id: string
  nome: string
  telefone: string
  email: string | null
  ramo_interesse: Ramo
  estado: EstadoLead
  notas: string | null
  origem: OrigemLead
  mensagem: string | null
  consentimento_em: string | null
  criado_em: string
  atualizado_em: string
}

// origem/mensagem/consentimento só são preenchidos pela função criar_lead_site.
export type LeadInsert = Omit<Lead, 'id' | 'criado_em' | 'atualizado_em' | 'origem' | 'mensagem' | 'consentimento_em'>

export interface Cliente {
  id: string
  nome: string
  nif: string | null
  telefone: string
  email: string | null
  morada: string | null
  lead_origem_id: string | null
  criado_em: string
}

export type ClienteInsert = Omit<Cliente, 'id' | 'criado_em'>

export type EstadoApolice = 'ativa' | 'pendente' | 'cancelada' | 'expirada'

export const ESTADOS_APOLICE: { valor: EstadoApolice; rotulo: string }[] = [
  { valor: 'ativa', rotulo: 'Ativa' },
  { valor: 'pendente', rotulo: 'Pendente' },
  { valor: 'cancelada', rotulo: 'Cancelada' },
  { valor: 'expirada', rotulo: 'Expirada' },
]

export interface Apolice {
  id: string
  cliente_id: string
  numero_apolice: string
  ramo: Ramo
  seguradora: string
  premio_anual: number | null
  data_inicio: string
  data_fim: string | null
  estado: EstadoApolice
  criado_em: string
}

export type ApoliceInsert = Omit<Apolice, 'id' | 'criado_em'>

export interface Profile {
  id: string
  nome: string
  email: string
  is_admin: boolean
  ativo: boolean
  criado_em: string
}

export type AlteracaoAcesso = Partial<Pick<Profile, 'ativo' | 'is_admin'>>

export type EstadoProposta = 'rascunho' | 'enviada' | 'aceite' | 'rejeitada'

export const ESTADOS_PROPOSTA: { valor: EstadoProposta; rotulo: string }[] = [
  { valor: 'rascunho', rotulo: 'Rascunho' },
  { valor: 'enviada', rotulo: 'Enviada' },
  { valor: 'aceite', rotulo: 'Aceite' },
  { valor: 'rejeitada', rotulo: 'Rejeitada' },
]

export interface Proposta {
  id: string
  lead_id: string | null
  cliente_id: string | null
  ramo: Ramo
  seguradora: string
  premio_anual_estimado: number | null
  coberturas: string | null
  estado: EstadoProposta
  notas: string | null
  criado_em: string
  atualizado_em: string
}

export type PropostaInsert = Omit<Proposta, 'id' | 'criado_em' | 'atualizado_em'>

export type EstadoRenovacao = 'pendente' | 'contactado' | 'renovada' | 'nao_renovada'

export const ESTADOS_RENOVACAO: { valor: EstadoRenovacao; rotulo: string }[] = [
  { valor: 'pendente', rotulo: 'Pendente' },
  { valor: 'contactado', rotulo: 'Contactado' },
  { valor: 'renovada', rotulo: 'Renovada' },
  { valor: 'nao_renovada', rotulo: 'Não renovada' },
]

export interface Renovacao {
  id: string
  apolice_id: string
  data_fim_anterior: string
  estado: EstadoRenovacao
  notas: string | null
  criado_em: string
  atualizado_em: string
}

export type RenovacaoInsert = Omit<Renovacao, 'id' | 'criado_em' | 'atualizado_em'>

export type EstadoSinistro = 'participado' | 'em_analise' | 'aprovado' | 'recusado' | 'pago'

export const ESTADOS_SINISTRO: { valor: EstadoSinistro; rotulo: string }[] = [
  { valor: 'participado', rotulo: 'Participado' },
  { valor: 'em_analise', rotulo: 'Em análise' },
  { valor: 'aprovado', rotulo: 'Aprovado' },
  { valor: 'recusado', rotulo: 'Recusado' },
  { valor: 'pago', rotulo: 'Pago' },
]

export interface Sinistro {
  id: string
  apolice_id: string
  numero_sinistro: string | null
  data_ocorrencia: string
  descricao: string
  estado: EstadoSinistro
  valor_estimado: number | null
  valor_pago: number | null
  notas: string | null
  criado_em: string
  atualizado_em: string
}

export type SinistroInsert = Omit<Sinistro, 'id' | 'criado_em' | 'atualizado_em'>

export type TipoAtividade = 'chamada' | 'email' | 'reuniao' | 'tarefa' | 'nota'

export const TIPOS_ATIVIDADE: { valor: TipoAtividade; rotulo: string }[] = [
  { valor: 'chamada', rotulo: 'Chamada' },
  { valor: 'email', rotulo: 'Email' },
  { valor: 'reuniao', rotulo: 'Reunião' },
  { valor: 'tarefa', rotulo: 'Tarefa' },
  { valor: 'nota', rotulo: 'Nota' },
]

export interface Atividade {
  id: string
  tipo: TipoAtividade
  titulo: string
  notas: string | null
  lead_id: string | null
  cliente_id: string | null
  responsavel_id: string | null
  concluida: boolean
  data_prevista: string | null
  data_atividade: string
  criado_em: string
}

export type AtividadeInsert = Omit<Atividade, 'id' | 'criado_em'>
