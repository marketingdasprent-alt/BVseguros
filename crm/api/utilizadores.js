import { createClient } from '@supabase/supabase-js'

// Ver o estado dos convites (GET), convidar/reenviar (POST) e excluir (DELETE) contas exigem a
// service-role key, que nunca pode ir para o browser: por isso vivem numa função da Vercel.
// Padrão copiado de razao-dinamica/crm/api/utilizadores.js.

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID_VALIDO = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i

export function createHandler({ env = process.env, client = createClient } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store')
    if (!['GET', 'POST', 'DELETE'].includes(req.method)) {
      res.setHeader('Allow', 'GET, POST, DELETE')
      return res.status(405).json({ error: 'Método não permitido.' })
    }

    const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
      return res.status(503).json({ error: 'A gestão de contas pelo CRM ainda não foi configurada (falta a SUPABASE_SERVICE_ROLE_KEY).' })
    }

    const token = /^Bearer (\S+)$/i.exec(req.headers.authorization || '')?.[1]
    if (!token) return res.status(401).json({ error: 'Inicie sessão novamente.' })

    try {
      const opcoes = { auth: { persistSession: false, autoRefreshToken: false } }
      const admin = client(url, serviceKey, opcoes)

      const { data: auth, error: authError } = await admin.auth.getUser(token)
      if (authError || !auth?.user) return res.status(401).json({ error: 'Sessão inválida. Inicie sessão novamente.' })

      const { data: autor, error: autorError } = await admin
        .from('profiles').select('nome, is_admin, ativo').eq('id', auth.user.id).single()
      if (autorError || !autor?.ativo || !autor.is_admin) {
        return res.status(403).json({ error: 'Só o administrador pode gerir contas.' })
      }

      if (req.method === 'GET') {
        // Convite pendente e último acesso só existem no Auth do Supabase, não em profiles.
        const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
        if (error) return res.status(503).json({ error: 'Não foi possível obter o estado das contas.' })
        const estados = Object.fromEntries(data.users.map((u) => [u.id, {
          convitePendente: !!u.invited_at && !u.email_confirmed_at,
          ultimoAcesso: u.last_sign_in_at ?? null,
        }]))
        return res.status(200).json({ estados })
      }

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const redirectTo = env.CRM_SITE_URL || undefined

      if (req.method === 'POST' && body?.acao === 'reenviar') {
        const id = typeof body.id === 'string' ? body.id : ''
        if (!UUID_VALIDO.test(id)) return res.status(400).json({ error: 'Utilizador inválido.' })
        const { data: alvo, error: alvoError } = await admin.auth.admin.getUserById(id)
        if (alvoError || !alvo?.user?.email) return res.status(404).json({ error: 'Esta conta já não existe. Atualize a página.' })
        if (alvo.user.email_confirmed_at) return res.status(409).json({ error: 'Esta pessoa já aceitou o convite. Se não se lembra da senha, pode usar "Esqueci a senha" no login.' })

        const { data: perfil } = await admin.from('profiles').select('nome').eq('id', id).maybeSingle()
        const nome = perfil?.nome ?? alvo.user.email
        // O Auth volta a enviar o convite enquanto a conta não estiver confirmada.
        const { error: conviteError } = await admin.auth.admin.inviteUserByEmail(alvo.user.email, { data: { nome }, redirectTo })
        if (conviteError) {
          const msg = conviteError.message || ''
          if (/security purposes|after \d+ seconds/i.test(msg)) {
            return res.status(429).json({ error: 'Acabou de ser enviado um convite a esta pessoa. Espere um minuto antes de reenviar.' })
          }
          const limite = conviteError.status === 429 || /rate limit/i.test(msg)
          return res.status(limite ? 429 : 409).json({
            error: limite
              ? 'O Supabase atingiu o limite de emails por hora. Tente mais tarde ou configure um SMTP próprio.'
              : 'Não foi possível reenviar o convite. Tente novamente.',
          })
        }
        await admin.from('eventos_acesso').insert({
          perfil_id: id, perfil_nome: nome, alteracao: 'convidado',
          realizado_por: auth.user.id, realizado_por_nome: autor.nome,
        })
        return res.status(200).json({ message: `Convite reenviado para ${alvo.user.email}.` })
      }

      if (req.method === 'DELETE') {
        const id = typeof body?.id === 'string' ? body.id : ''
        if (!UUID_VALIDO.test(id)) return res.status(400).json({ error: 'Utilizador inválido.' })
        // Excluir-se a si próprio deixava o admin fora do CRM a meio da sessão.
        if (id === auth.user.id) return res.status(400).json({ error: 'Não pode excluir a sua própria conta.' })

        const { data: alvo, error: alvoError } = await admin.from('profiles').select('nome, is_admin, ativo').eq('id', id).maybeSingle()
        if (alvoError) return res.status(503).json({ error: 'Não foi possível verificar a conta.' })
        if (!alvo) return res.status(404).json({ error: 'Esta conta já não existe. Atualize a página.' })
        if (alvo.is_admin && alvo.ativo) {
          // O trigger proteger_ultimo_admin também o garante, mas o Auth só devolveria um erro genérico.
          const { count } = await admin.from('profiles').select('id', { count: 'exact', head: true })
            .eq('is_admin', true).eq('ativo', true).neq('id', id)
          if (!count) return res.status(409).json({ error: 'Tem de existir pelo menos um administrador ativo.' })
        }

        // O perfil vai em cascata; o trigger proteger_ultimo_admin cancela se for o último admin ativo.
        const { error: apagarError } = await admin.auth.admin.deleteUser(id)
        if (apagarError) {
          const ultimoAdmin = /administrador ativo/i.test(apagarError.message || '')
          return res.status(409).json({
            error: ultimoAdmin
              ? 'Tem de existir pelo menos um administrador ativo.'
              : 'Não foi possível excluir a conta. Atualize a página e tente novamente.',
          })
        }

        await admin.from('eventos_acesso').insert({
          perfil_id: null, perfil_nome: alvo.nome, alteracao: 'excluido',
          realizado_por: auth.user.id, realizado_por_nome: autor.nome,
        })
        return res.status(200).json({ message: `A conta de ${alvo.nome} foi excluída.` })
      }
      const nome = typeof body?.nome === 'string' ? body.nome.trim() : ''
      const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
      if (nome.length < 2 || nome.length > 120) return res.status(400).json({ error: 'Indique um nome com 2 a 120 caracteres.' })
      if (!EMAIL_VALIDO.test(email) || email.length > 254) return res.status(400).json({ error: 'Indique um email válido.' })

      const { data: existente, error: existenteError } = await admin
        .from('profiles').select('id').eq('email', email).maybeSingle()
      if (existenteError) return res.status(503).json({ error: 'Não foi possível verificar as contas existentes.' })
      if (existente) return res.status(409).json({ error: 'Já existe uma conta com este email. Se ainda não aceitou o convite, use Reenviar convite na lista.' })

      // O nome vai nos metadados: o trigger handle_new_user usa-o para criar o perfil.
      const { data: convite, error: conviteError } = await admin.auth.admin.inviteUserByEmail(email, { data: { nome }, redirectTo })
      if (conviteError || !convite?.user) {
        const limite = conviteError?.status === 429 || /rate limit/i.test(conviteError?.message || '')
        return res.status(limite ? 429 : 409).json({
          error: limite
            ? 'O Supabase atingiu o limite de emails por hora. Tente mais tarde ou configure um SMTP próprio.'
            : 'Não foi possível enviar o convite. Verifique o email e tente novamente.',
        })
      }

      // Ativar com a sessão do admin (não com a service role) para o histórico
      // registar quem deu o acesso, pelo trigger auditar_acesso.
      const comoAutor = client(url, serviceKey, { ...opcoes, global: { headers: { Authorization: `Bearer ${token}` } } })
      const { error: ativarError } = await comoAutor.from('profiles').update({ ativo: true }).eq('id', convite.user.id)

      await admin.from('eventos_acesso').insert({
        perfil_id: convite.user.id, perfil_nome: nome, alteracao: 'convidado',
        realizado_por: auth.user.id, realizado_por_nome: autor.nome,
      })

      if (ativarError) {
        return res.status(201).json({ message: 'Convite enviado, mas a conta ficou sem acesso. Dê-lhe acesso na lista.' })
      }
      return res.status(201).json({ message: `Convite enviado para ${email}. A conta já tem acesso assim que definir a senha.` })
    } catch {
      return res.status(400).json({ error: 'Não foi possível concluir o pedido. Verifique os dados e tente novamente.' })
    }
  }
}

export default createHandler()
