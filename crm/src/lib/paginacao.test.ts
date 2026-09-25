import { describe, expect, it } from 'vitest'
import { lerTodasAsPaginas } from '@/lib/paginacao'

// Tabela falsa com `total` linhas, servida em páginas como o Supabase (range inclusivo).
function tabela(total: number) {
  const pedidos: [number, number][] = []
  const buscar = async (de: number, ate: number) => {
    pedidos.push([de, ate])
    const data = Array.from({ length: Math.max(0, Math.min(ate, total - 1) - de + 1) }, (_, i) => de + i)
    return { data, count: total, error: null }
  }
  return { buscar, pedidos }
}

describe('lerTodasAsPaginas', () => {
  it('uma página chega quando há menos linhas do que o tamanho', async () => {
    const t = tabela(3)
    const r = await lerTodasAsPaginas(t.buscar, 10)
    expect(r.linhas).toEqual([0, 1, 2])
    expect(t.pedidos).toHaveLength(1)
    expect(r.truncado).toBe(false)
  })

  it('junta várias páginas até acabar (o caso das 1000 linhas do Supabase)', async () => {
    const t = tabela(25)
    const r = await lerTodasAsPaginas(t.buscar, 10)
    expect(r.linhas).toHaveLength(25)
    expect(t.pedidos).toEqual([[0, 9], [10, 19], [20, 29]])
  })

  it('pára no tecto e diz que ficou truncado', async () => {
    const t = tabela(100)
    const r = await lerTodasAsPaginas(t.buscar, 10, 30)
    expect(r.linhas).toHaveLength(30)
    expect(r.truncado).toBe(true)
    expect(r.total).toBe(100)
  })

  it('propaga o erro em vez de devolver uma lista incompleta', async () => {
    await expect(lerTodasAsPaginas(async () => ({ data: null, count: null, error: new Error('falhou') }))).rejects.toThrow('falhou')
  })
})
