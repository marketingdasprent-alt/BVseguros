import { describe, expect, it } from 'vitest'
import { corresponde, normalizar } from '@/lib/pesquisa'

describe('normalizar', () => {
  it('tira acentos e maiúsculas', () => {
    expect(normalizar('  João Conceição ')).toBe('joao conceicao')
  })
})

describe('corresponde', () => {
  const campos = ['João Pereira', '913 000 000', null, 'Fidelidade']

  it('termo vazio mostra tudo', () => {
    expect(corresponde(campos, '   ')).toBe(true)
  })

  it('ignora acentos e maiúsculas', () => {
    expect(corresponde(campos, 'joao')).toBe(true)
  })

  it('várias palavras, em qualquer campo e ordem', () => {
    expect(corresponde(campos, 'fidelidade pereira')).toBe(true)
  })

  it('uma palavra que não existe exclui', () => {
    expect(corresponde(campos, 'joao ageas')).toBe(false)
  })
})
