import { describe, expect, it } from 'vitest'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { definirSenhaIsolada, entrarComSessao, lerLinkAcesso, MENSAGEM_LINK_INVALIDO, pedeSenha, verificarLink } from './acesso'

const TOKEN = 'pkce_0123456789abcdef'
const sessao = (id: string) => ({ access_token: `at-${id}`, refresh_token: `rt-${id}`, user: { id } }) as unknown as Session

// Cliente Supabase falso: só os métodos de auth usados em /acesso, com registo das chamadas.
function falso({ atual = null as Session | null, erroVerificar = null as unknown, erroSenha = null as unknown } = {}) {
  const chamadas: string[] = []
  const cliente = {
    rpc: async (nome: string) => { chamadas.push(`rpc:${nome}`); return { error: null } },
    auth: {
      verifyOtp: async (p: { token_hash: string; type: string }) => {
        chamadas.push(`verifyOtp:${p.type}`)
        return erroVerificar ? { data: {}, error: erroVerificar } : { data: { session: sessao('novo') }, error: null }
      },
      updateUser: async () => { chamadas.push('updateUser'); return { error: erroSenha } },
      getSession: async () => ({ data: { session: atual } }),
      signOut: async (o: { scope: string }) => { chamadas.push(`signOut:${o.scope}`); return { error: null } },
      setSession: async (s: { access_token: string }) => { chamadas.push(`setSession:${s.access_token}`); return { error: null } },
    },
  }
  return { cliente: cliente as unknown as SupabaseClient, chamadas }
}

describe('lerLinkAcesso', () => {
  it('lê o token e o tipo do link do email', () => {
    expect(lerLinkAcesso(`?token_hash=${TOKEN}&type=invite`)).toEqual({ tokenHash: TOKEN, tipo: 'invite' })
    expect(lerLinkAcesso(`?token_hash=${TOKEN}&type=signup`)).toEqual({ tokenHash: TOKEN, tipo: 'email' })
  })

  it('recusa links sem token, com tipo desconhecido ou com lixo', () => {
    expect(lerLinkAcesso('?type=invite')).toBeNull()
    expect(lerLinkAcesso(`?token_hash=${TOKEN}&type=magiclink`)).toBeNull()
    expect(lerLinkAcesso('?token_hash=<script>&type=invite')).toBeNull()
  })

  it('só convite e recuperação pedem senha', () => {
    expect(pedeSenha('invite') && pedeSenha('recovery')).toBe(true)
    expect(pedeSenha('email_change') || pedeSenha('email')).toBe(false)
  })
})

describe('verificarLink', () => {
  it('gasta o token no cliente isolado e devolve a sessão em memória', async () => {
    const { cliente, chamadas } = falso()
    const r = await verificarLink(cliente, { tokenHash: TOKEN, tipo: 'invite' })
    expect(r.ok).toBe(true)
    expect(r.sessao?.user.id).toBe('novo')
    expect(chamadas).toEqual(['verifyOtp:invite'])
  })

  it('link usado ou expirado: mensagem própria, sem sessão', async () => {
    const { cliente } = falso({ erroVerificar: { status: 403, code: 'otp_expired', message: 'Email link is invalid or has expired' } })
    const r = await verificarLink(cliente, { tokenHash: TOKEN, tipo: 'recovery' })
    expect(r).toMatchObject({ ok: false, erro: MENSAGEM_LINK_INVALIDO, linkInvalido: true })
  })
})

describe('definirSenhaIsolada', () => {
  it('define a senha e desliga o pedido de troca', async () => {
    const { cliente, chamadas } = falso()
    expect(await definirSenhaIsolada(cliente, 'uma-senha-boa')).toEqual({ ok: true })
    expect(chamadas).toEqual(['updateUser', 'rpc:senha_trocada'])
  })

  it('senha recusada: erro em PT e nada mais acontece', async () => {
    const { cliente, chamadas } = falso({ erroSenha: { message: 'Password should be at least 8 characters' } })
    const r = await definirSenhaIsolada(cliente, 'x')
    expect(r).toMatchObject({ ok: false })
    expect(chamadas).toEqual(['updateUser'])
  })
})

describe('entrarComSessao', () => {
  it('com sessão de outra pessoa, termina-a só neste browser antes de entrar', async () => {
    const { cliente, chamadas } = falso({ atual: sessao('admin') })
    expect(await entrarComSessao(cliente, sessao('novo'))).toEqual({ ok: true })
    expect(chamadas).toEqual(['signOut:local', 'setSession:at-novo'])
  })

  it('com a sessão da mesma pessoa (recuperar a própria senha), não termina nada', async () => {
    const { cliente, chamadas } = falso({ atual: sessao('novo') })
    await entrarComSessao(cliente, sessao('novo'))
    expect(chamadas).toEqual(['setSession:at-novo'])
  })
})
