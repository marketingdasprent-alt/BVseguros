import { describe, expect, it } from 'vitest'
import { dataLocalIso, formatarData, formatarDataRelativa, formatarMoeda, somarDias } from '@/lib/format'

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

describe('formatarDataRelativa', () => {
  // Datas locais, para o teste não depender do fuso horário da máquina.
  const agora = new Date(2026, 8, 25, 10, 0)

  it('hoje mostra só a hora', () => {
    expect(formatarDataRelativa(new Date(2026, 8, 25, 5, 49).toISOString(), agora)).toBe('Hoje, 05:49')
  })

  it('ontem, mesmo a poucos minutos da meia-noite', () => {
    expect(formatarDataRelativa(new Date(2026, 8, 24, 23, 58).toISOString(), agora)).toBe('Ontem, 23:58')
  })

  it('mais antigo mostra a data completa', () => {
    expect(formatarDataRelativa(new Date(2026, 8, 20, 18, 2).toISOString(), agora)).toBe('20/09/26, 18:02')
  })
})

describe('dataLocalIso', () => {
  it('usa o dia local, mesmo logo a seguir à meia-noite', () => {
    expect(dataLocalIso(new Date(2026, 8, 25, 0, 30))).toBe('2026-09-25')
  })

  it('soma dias atravessando o fim do mês', () => {
    expect(dataLocalIso(somarDias(new Date(2026, 8, 25), 60))).toBe('2026-11-24')
  })
})