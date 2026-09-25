import { describe, expect, it } from 'vitest'
import { createHandler } from '../api/utilizadores.js'

const ENV = { VITE_SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'service' }
const ADMIN = { id: 'aaaaaaaa-0000-0000-0000-000000000001', email: 'admin@bv.pt' }
const ALVO_ID = 'bbbbbbbb-0000-0000-0000-000000000002'

// Cliente Supabase falso: regista chamadas e devolve o que cada teste pede.
function falso({
  autor = { nome: 'Admin', is_admin: true, ativo: true },
  existente = null,
  alvo = { nome: 'Nuno', is_admin: false, ativo: true },
  outrosAdmins = 1,
  erroConvite = null,
  authUser = { email: 'nuno@bv.pt', invited_at: '2026-09-24', email_confirmed_at: null },
} = {}) {
  const chamadas = { convites: [], updates: [], inserts: [], apagados: [] }
  const client = (_url, _key, opcoes) => {
    const authHeader = opcoes?.global?.headers?.Authorization
    const tabela = (nome) => {
      const estado = { filtros: [], contar: false }
      const q = {
        select: (_cols, o) => { estado.contar = !!o?.count; return q },
        eq: (col, v) => { estado.filtros.push([col, v]); return q },
        neq: () => q,
        single: async () => ({ data: autor, error: autor ? null : new Error('x') }),
        // Procura por email = convite; por id = exclusão.
        maybeSingle: async () => ({ data: estado.filtros[0]?.[0] === 'email' ? existente : alvo, error: null }),
        then: (ok) => ok(estado.contar ? { count: outrosAdmins, error: null } : { error: null }),
        update: (dados) => ({
          eq: async (_c, id) => {
            chamadas.updates.push({ nome, dados, id, auth: authHeader })
            return { error: null }
          },
        }),
        insert: async (dados) => {
          chamadas.inserts.push({ nome, dados })
          return { error: null }
        },
      }
      return q
    }
    return {
      auth: {
        getUser: async (token) => (token === 'bom' ? { data: { user: ADMIN }, error: null } : { data: {}, error: new Error('x') }),
        admin: {
          inviteUserByEmail: async (email, o) => {
            chamadas.convites.push({ email, ...o })
            return erroConvite ? { data: {}, error: erroConvite } : { data: { user: { id: 'novo-id' } }, error: null }
          },
          listUsers: async () => ({
            data: {
              users: [
                { id: 'p', invited_at: '2026-09-24', email_confirmed_at: null, last_sign_in_at: null },
                { id: 'a', invited_at: '2026-09-20', email_confirmed_at: '2026-09-20', last_sign_in_at: '2026-09-25T10:00:00Z' },
              ],
            },
            error: null,
          }),
          getUserById: async () => (authUser ? { data: { user: authUser }, error: null } : { data: {}, error: new Error('x') }),
          deleteUser: async (id) => {
            chamadas.apagados.push(id)
            return { error: null }
          },
        },
      },
      from: tabela,
    }
  }
  return { client, chamadas }
}

async function pedir(handler, { method = 'POST', token = 'bom', body = { nome: 'Nuno Costa', email: 'Nuno@BV.pt ' } } = {}) {
  const res = { headers: {}, statusCode: 200, corpo: null }
  res.setHeader = (k, v) => { res.headers[k] = v }
  res.status = (c) => { res.statusCode = c; return res }
  res.json = (d) => { res.corpo = d; return res }
  await handler({ method, headers: token ? { authorization: `Bearer ${token}` } : {}, body }, res)
  return res
}

describe('api/utilizadores', () => {
  it('só aceita GET, POST e DELETE', async () => {
    expect((await pedir(createHandler({ env: ENV, client: falso().client }), { method: 'PUT' })).statusCode).toBe(405)
  })

  it('sem service-role key responde 503 em vez de falhar', async () => {
    expect((await pedir(createHandler({ env: {}, client: falso().client }))).statusCode).toBe(503)
  })

  it('sem sessão ou com sessão inválida responde 401', async () => {
    const h = createHandler({ env: ENV, client: falso().client })
    expect((await pedir(h, { token: null })).statusCode).toBe(401)
    expect((await pedir(h, { token: 'mau' })).statusCode).toBe(401)
  })

  it('quem não é admin ativo não convida nem exclui', async () => {
    const { client, chamadas } = falso({ autor: { nome: 'M', is_admin: false, ativo: true } })
    const h = createHandler({ env: ENV, client })
    expect((await pedir(h)).statusCode).toBe(403)
    expect((await pedir(h, { method: 'DELETE', body: { id: ALVO_ID } })).statusCode).toBe(403)
    expect(chamadas.convites).toHaveLength(0)
    expect(chamadas.apagados).toHaveLength(0)
  })
})

describe('api/utilizadores: convidar (POST)', () => {
  it('valida nome e email', async () => {
    const h = createHandler({ env: ENV, client: falso().client })
    expect((await pedir(h, { body: { nome: 'N', email: 'a@b.pt' } })).statusCode).toBe(400)
    expect((await pedir(h, { body: { nome: 'Nuno', email: 'nao-e-email' } })).statusCode).toBe(400)
  })

  it('não convida um email que já tem conta', async () => {
    const { client, chamadas } = falso({ existente: { id: 'x' } })
    expect((await pedir(createHandler({ env: ENV, client }))).statusCode).toBe(409)
    expect(chamadas.convites).toHaveLength(0)
  })

  it('convida, ativa com a sessão do admin e regista no histórico', async () => {
    const { client, chamadas } = falso()
    const res = await pedir(createHandler({ env: ENV, client }))
    expect(res.statusCode).toBe(201)
    expect(chamadas.convites[0]).toMatchObject({ email: 'nuno@bv.pt', data: { nome: 'Nuno Costa' } })
    expect(chamadas.updates[0]).toMatchObject({ nome: 'profiles', dados: { ativo: true }, id: 'novo-id', auth: 'Bearer bom' })
    expect(chamadas.inserts[0].dados).toMatchObject({ alteracao: 'convidado', perfil_nome: 'Nuno Costa', realizado_por: ADMIN.id })
  })

  it('explica o limite de emails do Supabase', async () => {
    const { client } = falso({ erroConvite: { status: 429, message: 'email rate limit exceeded' } })
    const res = await pedir(createHandler({ env: ENV, client }))
    expect(res.statusCode).toBe(429)
    expect(res.corpo.error).toMatch(/limite/)
  })
})

describe('api/utilizadores: excluir (DELETE)', () => {
  it('recusa id inválido e a própria conta', async () => {
    const { client, chamadas } = falso()
    const h = createHandler({ env: ENV, client })
    expect((await pedir(h, { method: 'DELETE', body: { id: 'x' } })).statusCode).toBe(400)
    expect((await pedir(h, { method: 'DELETE', body: { id: ADMIN.id } })).statusCode).toBe(400)
    expect(chamadas.apagados).toHaveLength(0)
  })

  it('responde 404 se a conta já não existe', async () => {
    const { client } = falso({ alvo: null })
    expect((await pedir(createHandler({ env: ENV, client }), { method: 'DELETE', body: { id: ALVO_ID } })).statusCode).toBe(404)
  })

  it('não exclui o último admin ativo', async () => {
    const { client, chamadas } = falso({ alvo: { nome: 'Outro admin', is_admin: true, ativo: true }, outrosAdmins: 0 })
    const res = await pedir(createHandler({ env: ENV, client }), { method: 'DELETE', body: { id: ALVO_ID } })
    expect(res.statusCode).toBe(409)
    expect(chamadas.apagados).toHaveLength(0)
  })

  it('exclui a conta e regista no histórico', async () => {
    const { client, chamadas } = falso()
    const res = await pedir(createHandler({ env: ENV, client }), { method: 'DELETE', body: { id: ALVO_ID } })
    expect(res.statusCode).toBe(200)
    expect(chamadas.apagados).toEqual([ALVO_ID])
    expect(chamadas.inserts[0].dados).toMatchObject({ alteracao: 'excluido', perfil_nome: 'Nuno', realizado_por: ADMIN.id })
  })
})

describe('api/utilizadores: estado das contas (GET)', () => {
  it('diz quem tem convite pendente e o último acesso', async () => {
    const res = await pedir(createHandler({ env: ENV, client: falso().client }), { method: 'GET', body: undefined })
    expect(res.statusCode).toBe(200)
    expect(res.corpo.estados.p).toEqual({ convitePendente: true, ultimoAcesso: null })
    expect(res.corpo.estados.a).toEqual({ convitePendente: false, ultimoAcesso: '2026-09-25T10:00:00Z' })
  })

  it('quem não é admin não vê', async () => {
    const { client } = falso({ autor: { nome: 'M', is_admin: false, ativo: true } })
    expect((await pedir(createHandler({ env: ENV, client }), { method: 'GET', body: undefined })).statusCode).toBe(403)
  })
})

describe('api/utilizadores: reenviar convite (POST acao=reenviar)', () => {
  const reenviar = { acao: 'reenviar', id: ALVO_ID }

  it('reenvia a quem ainda não aceitou e regista no histórico', async () => {
    const { client, chamadas } = falso()
    const res = await pedir(createHandler({ env: ENV, client }), { body: reenviar })
    expect(res.statusCode).toBe(200)
    expect(chamadas.convites[0]).toMatchObject({ email: 'nuno@bv.pt', data: { nome: 'Nuno' } })
    expect(chamadas.inserts[0].dados).toMatchObject({ alteracao: 'convidado', perfil_id: ALVO_ID })
  })

  it('não reenvia a quem já aceitou', async () => {
    const { client, chamadas } = falso({ authUser: { email: 'nuno@bv.pt', invited_at: 'x', email_confirmed_at: 'y' } })
    expect((await pedir(createHandler({ env: ENV, client }), { body: reenviar })).statusCode).toBe(409)
    expect(chamadas.convites).toHaveLength(0)
  })

  it('explica a espera de um minuto entre envios', async () => {
    const { client } = falso({ erroConvite: { status: 429, message: 'For security purposes, you can only request this after 42 seconds.' } })
    const res = await pedir(createHandler({ env: ENV, client }), { body: reenviar })
    expect(res.statusCode).toBe(429)
    expect(res.corpo.error).toMatch(/minuto/)
  })

  it('recusa id inválido', async () => {
    expect((await pedir(createHandler({ env: ENV, client: falso().client }), { body: { acao: 'reenviar', id: 'x' } })).statusCode).toBe(400)
  })
})