import { describe, expect, it } from 'vitest'
import { MODULOS, normalizarPermissao, podeFazer, rotaInicial } from '@/lib/permissoes'
import type { MinhasPermissoes } from '@/lib/permissoes'

const perms: MinhasPermissoes = {
  grupo: 'Comercial',
  carteira: 'propria',
  modulos: {
    leads: { nivel: 'editar', apagar: true, atribuir: false },
    clientes: { nivel: 'ver', apagar: false, atribuir: false },
  },
}

describe('podeFazer', () => {
  it('o administrador pode tudo, mesmo sem grupo', () => {
    expect(podeFazer(true, null, 'sinistros', 'apagar')).toBe(true)
  })

  it('segue o nível e os extras do grupo', () => {
    expect(podeFazer(false, perms, 'leads', 'ver')).toBe(true)
    expect(podeFazer(false, perms, 'leads', 'apagar')).toBe(true)
    expect(podeFazer(false, perms, 'leads', 'atribuir')).toBe(false)
    expect(podeFazer(false, perms, 'clientes', 'ver')).toBe(true)
    expect(podeFazer(false, perms, 'clientes', 'editar')).toBe(false)
  })

  it('módulo fora do grupo, ou conta sem grupo, não tem acesso', () => {
    expect(podeFazer(false, perms, 'apolices', 'ver')).toBe(false)
    expect(podeFazer(false, null, 'leads', 'ver')).toBe(false)
  })

  it('"só ver" com um extra guardado por engano não apaga', () => {
    const p: MinhasPermissoes = { ...perms, modulos: { leads: { nivel: 'ver', apagar: true, atribuir: true } } }
    expect(podeFazer(false, p, 'leads', 'apagar')).toBe(false)
  })
})

describe('rotaInicial', () => {
  it('vai para o primeiro módulo que a pessoa pode ver', () => {
    expect(rotaInicial((m) => m === 'clientes' || m === 'sinistros')).toBe('/clientes')
    expect(rotaInicial(() => false)).toBeNull()
    // Atividades não tem página: sozinho não dá rota inicial.
    expect(rotaInicial((m) => m === 'atividades')).toBeNull()
  })
})

describe('normalizarPermissao', () => {
  const modulo = (id: string) => MODULOS.find((m) => m.id === id)!
  it('tira os extras a quem não edita e o "atribuir" onde não existe', () => {
    expect(normalizarPermissao(modulo('leads'), { nivel: 'ver', apagar: true, atribuir: true })).toEqual({ nivel: 'ver', apagar: false, atribuir: false })
    expect(normalizarPermissao(modulo('apolices'), { nivel: 'editar', apagar: true, atribuir: true })).toEqual({ nivel: 'editar', apagar: true, atribuir: false })
  })
  it('o Dashboard nunca passa de "ver"', () => {
    expect(normalizarPermissao(modulo('dashboard'), { nivel: 'editar', apagar: false, atribuir: false }).nivel).toBe('ver')
  })
})
