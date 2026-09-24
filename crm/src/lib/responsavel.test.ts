import { describe, expect, it } from 'vitest'
import { filtrarPorResponsavel, lerFiltroResponsavel } from '@/lib/responsavel'

const itens = [
  { id: 'a', responsavel_id: 'eu' },
  { id: 'b', responsavel_id: 'outro' },
  { id: 'c', responsavel_id: null },
]

describe('filtrarPorResponsavel', () => {
  it('todos devolve tudo', () => {
    expect(filtrarPorResponsavel(itens, 'todos', 'eu')).toHaveLength(3)
  })

  it('os meus devolve só os atribuídos à conta atual', () => {
    expect(filtrarPorResponsavel(itens, 'meus', 'eu').map((i) => i.id)).toEqual(['a'])
  })

  it('os meus sem conta carregada não devolve os livres', () => {
    expect(filtrarPorResponsavel(itens, 'meus', null)).toEqual([])
  })

  it('sem responsável devolve só os livres', () => {
    expect(filtrarPorResponsavel(itens, 'sem_responsavel', 'eu').map((i) => i.id)).toEqual(['c'])
  })
})

describe('lerFiltroResponsavel', () => {
  it('valor desconhecido na URL volta a todos', () => {
    expect(lerFiltroResponsavel('xpto')).toBe('todos')
    expect(lerFiltroResponsavel(null)).toBe('todos')
    expect(lerFiltroResponsavel('meus')).toBe('meus')
  })
})
