import type { EstadoApolice, EstadoLead, EstadoProposta, EstadoRenovacao, EstadoSinistro } from './types'

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export const TONE_ESTADO_LEAD: Record<EstadoLead, Tone> = {
  novo: 'info',
  contactado: 'warning',
  proposta_enviada: 'warning',
  convertido: 'success',
  perdido: 'danger',
}

export const TONE_ESTADO_PROPOSTA: Record<EstadoProposta, Tone> = {
  rascunho: 'neutral',
  enviada: 'info',
  aceite: 'success',
  rejeitada: 'danger',
}

export const TONE_ESTADO_APOLICE: Record<EstadoApolice, Tone> = {
  ativa: 'success',
  pendente: 'warning',
  cancelada: 'danger',
  expirada: 'danger',
}

export const TONE_ESTADO_RENOVACAO: Record<EstadoRenovacao, Tone> = {
  pendente: 'neutral',
  contactado: 'warning',
  renovada: 'success',
  nao_renovada: 'danger',
}

export const TONE_ESTADO_SINISTRO: Record<EstadoSinistro, Tone> = {
  participado: 'info',
  em_analise: 'warning',
  aprovado: 'success',
  recusado: 'danger',
  pago: 'success',
}

export const TONE_BAR_CLASS: Record<Tone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  neutral: 'bg-border-strong',
}
