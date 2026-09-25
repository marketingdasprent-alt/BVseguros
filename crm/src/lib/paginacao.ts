// O Supabase devolve no máximo 1000 linhas por pedido; sem isto as listas ficavam
// incompletas sem aviso. O tecto evita descarregar uma tabela gigante por engano.
export const TAMANHO_PAGINA = 1000
export const TECTO_LINHAS = 20_000

export interface ResultadoPaginado<T> {
  linhas: T[]
  total: number | null
  truncado: boolean
}

type BuscarPagina<T> = (de: number, ate: number) => Promise<{ data: T[] | null; count: number | null; error: Error | null }>

export async function lerTodasAsPaginas<T>(
  buscarPagina: BuscarPagina<T>,
  tamanho = TAMANHO_PAGINA,
  tecto = TECTO_LINHAS,
): Promise<ResultadoPaginado<T>> {
  const linhas: T[] = []
  let total: number | null = null
  for (let de = 0; de < tecto; de += tamanho) {
    const ate = Math.min(de + tamanho, tecto) - 1
    const { data, count, error } = await buscarPagina(de, ate)
    if (error) throw error
    if (count !== null) total = count
    const pagina = data ?? []
    linhas.push(...pagina)
    if (pagina.length < ate - de + 1) break
  }
  return { linhas, total, truncado: total !== null && total > linhas.length }
}
