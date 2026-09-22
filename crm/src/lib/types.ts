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

export interface Lead {
  id: string
  nome: string
  telefone: string
  email: string | null
  ramo_interesse: Ramo
  estado: EstadoLead
  notas: string | null
  criado_em: string
  atualizado_em: string
}

export type LeadInsert = Omit<Lead, 'id' | 'criado_em' | 'atualizado_em'>

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
}
