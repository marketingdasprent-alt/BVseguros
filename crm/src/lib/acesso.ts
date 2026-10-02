import type { EmailOtpType, Session, SupabaseClient } from '@supabase/supabase-js'

// Links dos emails de autenticação: /acesso?token_hash=...&type=... (templates em
// supabase/emails/). Abrir a página não gasta o token: só o envio do formulário.
export type TipoAcesso = Extract<EmailOtpType, 'invite' | 'recovery' | 'email_change' | 'email'>

export interface LinkAcesso {
  tokenHash: string
  tipo: TipoAcesso
}

const TIPOS: Record<string, TipoAcesso> = {
  invite: 'invite',
  recovery: 'recovery',
  email_change: 'email_change',
  email: 'email',
  signup: 'email',
}

export function lerLinkAcesso(search: string): LinkAcesso | null {
  const p = new URLSearchParams(search)
  const tokenHash = p.get('token_hash') ?? ''
  const tipo = TIPOS[p.get('type') ?? '']
  if (!tipo || !/^[A-Za-z0-9_-]{8,200}$/.test(tokenHash)) return null
  return { tokenHash, tipo }
}

/** Convite e recuperação terminam com uma senha; os outros só confirmam o email. */
export const pedeSenha = (tipo: TipoAcesso) => tipo === 'invite' || tipo === 'recovery'

export const MENSAGEM_LINK_INVALIDO = 'Este link já foi usado ou expirou.'

export type Resultado = { ok: true } | { ok: false; erro: string; linkInvalido?: boolean }

/** Gasta o token no cliente isolado. A sessão devolvida fica só em memória. */
export async function verificarLink(isolado: SupabaseClient, link: LinkAcesso): Promise<Resultado & { sessao?: Session | null }> {
  const { data, error } = await isolado.auth.verifyOtp({ token_hash: link.tokenHash, type: link.tipo })
  if (error) {
    const invalido = error.status === 403 || /expired|invalid|not found|otp/i.test(`${error.code ?? ''} ${error.message}`)
    return { ok: false, erro: invalido ? MENSAGEM_LINK_INVALIDO : 'Não foi possível validar o link. Verifique a ligação e tente novamente.', linkInvalido: invalido }
  }
  return { ok: true, sessao: data.session }
}

export function mensagemSenha(mensagem: string): string {
  if (/different from the old/i.test(mensagem)) return 'A senha nova tem de ser diferente da atual.'
  if (/weak|pwned|characters/i.test(mensagem)) return 'Esta senha foi recusada por ser fraca. Escolha outra, mais longa.'
  return 'Não foi possível guardar a senha. Tente novamente.'
}

/** Define a senha na sessão em memória; pode repetir-se enquanto a página estiver aberta. */
export async function definirSenhaIsolada(isolado: SupabaseClient, senha: string): Promise<Resultado> {
  const { error } = await isolado.auth.updateUser({ password: senha })
  if (error) return { ok: false, erro: mensagemSenha(error.message) }
  // Desliga o "trocar a senha no próximo acesso"; se falhar, o pior é pedir a senha outra vez.
  const { error: erroFlag } = await isolado.rpc('senha_trocada')
  if (erroFlag) console.error('senha_trocada', erroFlag)
  return { ok: true }
}

/**
 * Só agora a sessão nova passa para o cliente principal. Se havia sessão de outra
 * pessoa, termina-a neste browser (scope local: os outros dispositivos dela continuam).
 */
export async function entrarComSessao(principal: SupabaseClient, sessao: Session): Promise<Resultado> {
  const { data } = await principal.auth.getSession()
  if (data.session && data.session.user.id !== sessao.user.id) await principal.auth.signOut({ scope: 'local' })
  const { error } = await principal.auth.setSession({ access_token: sessao.access_token, refresh_token: sessao.refresh_token })
  if (error) return { ok: false, erro: 'A senha foi definida, mas não foi possível entrar. Entre com o email e a senha nova.' }
  return { ok: true }
}
