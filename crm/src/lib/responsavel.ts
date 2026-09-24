export type FiltroResponsavel = 'todos' | 'meus' | 'sem_responsavel'

export const FILTROS_RESPONSAVEL: { valor: FiltroResponsavel; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'meus', rotulo: 'Os meus' },
  { valor: 'sem_responsavel', rotulo: 'Sem responsável' },
]

export function lerFiltroResponsavel(valor: string | null): FiltroResponsavel {
  return FILTROS_RESPONSAVEL.some((f) => f.valor === valor) ? (valor as FiltroResponsavel) : 'todos'
}

export function filtrarPorResponsavel<T extends { responsavel_id: string | null }>(
  itens: T[],
  filtro: FiltroResponsavel,
  meuId: string | null,
): T[] {
  if (filtro === 'meus') return itens.filter((i) => meuId !== null && i.responsavel_id === meuId)
  if (filtro === 'sem_responsavel') return itens.filter((i) => i.responsavel_id === null)
  return itens
}
