import type { Carteira, Modulo, PermissaoModulo } from '@/lib/permissoes'
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
  { valor: 'outro', rotulo: 'Outros seguros' },
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
  responsavel_id: string | null
  criado_em: string
  atualizado_em: string
}

// origem/mensagem/consentimento só são preenchidos pela função criar_lead_site;
// o responsável é definido pela base de dados (quem cria).
export type LeadInsert = Omit<Lead, 'id' | 'criado_em' | 'atualizado_em' | 'origem' | 'mensagem' | 'consentimento_em' | 'responsavel_id'>

export type LeadEdicao = Pick<Lead, 'nome' | 'telefone' | 'email' | 'ramo_interesse' | 'notas'>

export interface Cliente {
  id: string
  nome: string
  nif: string | null
  telefone: string
  email: string | null
  morada: string | null
  lead_origem_id: string | null
  responsavel_id: string | null
  criado_em: string
}

export type ClienteInsert = Omit<Cliente, 'id' | 'criado_em' | 'responsavel_id'>

// Também são os dados pedidos ao converter um lead em cliente.
export type ClienteEdicao = Pick<Cliente, 'nome' | 'telefone' | 'email' | 'nif' | 'morada'>

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

export interface Seguradora {
  id: string
  nome: string
  ativa: boolean
  criado_em: string
}

export interface Profile {
  id: string
  nome: string
  email: string
  is_admin: boolean
  ativo: boolean
  // Sem grupo, uma conta que não é admin não vê nenhum módulo.
  grupo_id: string | null
  // Senha definida pelo admin: no próximo acesso o CRM pede uma nova.
  deve_trocar_senha: boolean
  criado_em: string
}

export type AlteracaoAcesso = Partial<Pick<Profile, 'ativo' | 'is_admin' | 'grupo_id'>>

export interface Grupo {
  id: string
  nome: string
  descricao: string | null
  carteira: Carteira
  criado_em: string
}

// Um grupo com as permissões de todos os módulos (os que faltam na base valem "sem acesso").
export interface GrupoComPermissoes extends Grupo {
  permissoes: Record<Modulo, PermissaoModulo>
  membros: number
}

export type GrupoEdicao = Pick<Grupo, 'nome' | 'descricao' | 'carteira'> & { permissoes: Record<Modulo, PermissaoModulo> }

// Vem do Auth do Supabase (api/utilizadores.js, GET), não de profiles.
export interface EstadoConta {
  convitePendente: boolean
  ultimoAcesso: string | null
}

// Vista da equipa sem emails, disponível a todas as contas ativas (listar_equipa).
export type MembroEquipa = Pick<Profile, 'id' | 'nome' | 'ativo'>

export type AlteracaoRegistada = 'acesso_dado' | 'acesso_retirado' | 'tornado_admin' | 'tornado_mediador' | 'nome_alterado' | 'convidado' | 'excluido' | 'grupo_alterado' | 'conta_criada' | 'senha_definida'

export const ROTULOS_ALTERACAO: Record<AlteracaoRegistada, string> = {
  acesso_dado: 'deu acesso a',
  acesso_retirado: 'retirou o acesso a',
  tornado_admin: 'tornou administrador',
  tornado_mediador: 'tornou mediador',
  nome_alterado: 'mudou o nome para',
  convidado: 'convidou',
  excluido: 'apagou a conta de',
  grupo_alterado: 'mudou o grupo de',
  conta_criada: 'criou com senha a conta de',
  senha_definida: 'definiu a senha de',
}

export interface EventoAcesso {
  id: string
  perfil_id: string | null
  perfil_nome: string
  alteracao: AlteracaoRegistada
  realizado_por: string | null
  realizado_por_nome: string | null
  nome_anterior: string | null
  // Em grupo_alterado: o nome do grupo novo.
  detalhe: string | null
  criado_em: string
}

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

// A origem (lead ou cliente) não muda depois de criada.
export type PropostaEdicao = Pick<Proposta, 'ramo' | 'seguradora' | 'premio_anual_estimado' | 'coberturas' | 'notas'>

export type EstadoRenovacao = 'pendente' | 'contactado' | 'renovada' | 'nao_renovada'

export const ESTADOS_RENOVACAO: { valor: EstadoRenovacao; rotulo: string }[] = [
  { valor: 'pendente', rotulo: 'Pendente' },
  { valor: 'contactado', rotulo: 'Contactada' },
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

export type SinistroEdicao = Omit<SinistroInsert, 'apolice_id' | 'estado'>

// Pedido de ajuda com um sinistro feito no site (pedidos_sinistro). Vira um Sinistro
// quando a equipa o liga a uma apólice (converter_pedido_sinistro).
export type EstadoPedidoSinistro = 'novo' | 'em_tratamento' | 'convertido' | 'arquivado'

export const ESTADOS_PEDIDO_SINISTRO: { valor: EstadoPedidoSinistro; rotulo: string }[] = [
  { valor: 'novo', rotulo: 'Novo' },
  { valor: 'em_tratamento', rotulo: 'Em tratamento' },
  { valor: 'convertido', rotulo: 'Convertido em sinistro' },
  { valor: 'arquivado', rotulo: 'Arquivado' },
]

export interface PedidoSinistro {
  id: string
  criado_em: string
  atualizado_em: string
  nome: string
  email: string
  telefone: string
  ramo: Ramo
  numero_apolice: string | null
  seguradora: string | null
  data_ocorrencia: string
  local: string | null
  descricao: string
  detalhes: Record<string, string>
  consentimento_em: string
  estado: EstadoPedidoSinistro
  cliente_id: string | null
  sinistro_id: string | null
  tratado_por: string | null
  notas: string | null
}

export type PedidoSinistroEdicao = Partial<Pick<PedidoSinistro, 'estado' | 'notas' | 'tratado_por'>>

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

export type AtividadeEdicao = Pick<Atividade, 'tipo' | 'titulo' | 'notas' | 'lead_id' | 'cliente_id' | 'data_prevista'>
