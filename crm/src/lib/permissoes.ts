// Módulos que um grupo pode ter. Os mesmos ids que a base de dados usa em grupo_permissoes
// e em public.pode(); quem garante o acesso é a RLS, isto só decide o que o CRM mostra.
export type Modulo = 'dashboard' | 'leads' | 'propostas' | 'clientes' | 'apolices' | 'renovacoes' | 'sinistros' | 'atividades'
export type NivelAcesso = 'nenhum' | 'ver' | 'editar'
export type AcaoPermissao = 'ver' | 'editar' | 'apagar' | 'atribuir'
export type Carteira = 'toda' | 'propria'

export interface PermissaoModulo {
  nivel: NivelAcesso
  apagar: boolean
  atribuir: boolean
}

export interface MinhasPermissoes {
  grupo: string | null
  carteira: Carteira
  modulos: Partial<Record<Modulo, PermissaoModulo>>
}

export interface DefinicaoModulo {
  id: Modulo
  rotulo: string
  rota: string
  descricao: string
  // Dashboard só se vê; não há nada para editar.
  soVer?: boolean
  // "Atribuir responsável" só existe onde há responsável.
  temAtribuir?: boolean
}

export const MODULOS: DefinicaoModulo[] = [
  { id: 'dashboard', rotulo: 'Dashboard', rota: '/', descricao: 'Resumo, prioridades e atividade recente.', soVer: true },
  { id: 'leads', rotulo: 'Leads', rota: '/leads', descricao: 'Contactos por converter, incluindo os pedidos do site.', temAtribuir: true },
  { id: 'propostas', rotulo: 'Propostas', rota: '/propostas', descricao: 'Simulações e propostas enviadas.' },
  { id: 'clientes', rotulo: 'Clientes', rota: '/clientes', descricao: 'Clientes e a ficha de cada um.', temAtribuir: true },
  { id: 'apolices', rotulo: 'Apólices', rota: '/apolices', descricao: 'Contratos, prémios e datas.' },
  { id: 'renovacoes', rotulo: 'Renovações', rota: '/renovacoes', descricao: 'Apólices a chegar ao fim e o seu seguimento.' },
  { id: 'sinistros', rotulo: 'Sinistros', rota: '/sinistros', descricao: 'Participações e o seu estado.' },
  { id: 'atividades', rotulo: 'Tarefas', rota: '/atividades', descricao: 'Tarefas, chamadas, emails, reuniões e notas.' },
]

export const SEM_PERMISSAO: PermissaoModulo = { nivel: 'nenhum', apagar: false, atribuir: false }

export function podeFazer(isAdmin: boolean, permissoes: MinhasPermissoes | null, modulo: Modulo, acao: AcaoPermissao): boolean {
  if (isAdmin) return true
  const p = permissoes?.modulos[modulo]
  if (!p) return false
  if (acao === 'ver') return p.nivel === 'ver' || p.nivel === 'editar'
  if (p.nivel !== 'editar') return false
  if (acao === 'editar') return true
  return acao === 'apagar' ? p.apagar : p.atribuir
}

// Para onde vai quem não tem Dashboard: o primeiro módulo que pode ver.
export function rotaInicial(pode: (modulo: Modulo, acao: AcaoPermissao) => boolean): string | null {
  return MODULOS.find((m) => pode(m.id, 'ver'))?.rota ?? null
}

// Mantém as regras da base de dados: extras só com "editar", "atribuir" só onde existe.
export function normalizarPermissao(modulo: DefinicaoModulo, p: PermissaoModulo): PermissaoModulo {
  const nivel = modulo.soVer && p.nivel === 'editar' ? 'ver' : p.nivel
  return {
    nivel,
    apagar: nivel === 'editar' && p.apagar,
    atribuir: nivel === 'editar' && !!modulo.temAtribuir && p.atribuir,
  }
}
