import { describe, expect, it } from 'vitest'
import { ESTADOS_APOLICE, ESTADOS_LEAD, ESTADOS_PROPOSTA, ESTADOS_RENOVACAO, ESTADOS_SINISTRO } from '@/lib/types'
import {
  TONE_ESTADO_APOLICE,
  TONE_ESTADO_LEAD,
  TONE_ESTADO_PROPOSTA,
  TONE_ESTADO_RENOVACAO,
  TONE_ESTADO_SINISTRO,
} from '@/lib/tone'

// Garante que cada novo estado adicionado a lib/types.ts recebe sempre uma
// cor correspondente — sem isto, um estado esquecido rebenta em runtime só
// quando alguém o encontra na UI (Badge com tone `undefined`).
describe('mapas de tone cobrem todos os estados definidos', () => {
  it('EstadoLead', () => {
    for (const { valor } of ESTADOS_LEAD) expect(TONE_ESTADO_LEAD[valor]).toBeDefined()
  })

  it('EstadoProposta', () => {
    for (const { valor } of ESTADOS_PROPOSTA) expect(TONE_ESTADO_PROPOSTA[valor]).toBeDefined()
  })

  it('EstadoApolice', () => {
    for (const { valor } of ESTADOS_APOLICE) expect(TONE_ESTADO_APOLICE[valor]).toBeDefined()
  })

  it('EstadoRenovacao', () => {
    for (const { valor } of ESTADOS_RENOVACAO) expect(TONE_ESTADO_RENOVACAO[valor]).toBeDefined()
  })

  it('EstadoSinistro', () => {
    for (const { valor } of ESTADOS_SINISTRO) expect(TONE_ESTADO_SINISTRO[valor]).toBeDefined()
  })
})
