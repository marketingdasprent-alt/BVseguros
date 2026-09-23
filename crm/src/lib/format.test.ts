import { describe, expect, it } from 'vitest'
import { formatarData, formatarMoeda } from '@/lib/format'

describe('formatarMoeda', () => {
  it('formata em euros no padrão pt-PT', () => {
    expect(formatarMoeda(600)).toBe('600,00 €')
  })

  it('formata zero corretamente', () => {
    expect(formatarMoeda(0)).toBe('0,00 €')
  })
})

describe('formatarData', () => {
  it('converte aaaa-mm-dd para dd/mm/aaaa', () => {
    expect(formatarData('2026-09-23')).toBe('23/09/2026')
  })

  it('preserva zeros à esquerda no dia e no mês', () => {
    expect(formatarData('2026-01-05')).toBe('05/01/2026')
  })
})
