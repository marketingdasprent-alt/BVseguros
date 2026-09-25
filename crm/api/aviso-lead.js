import { createClient } from '@supabase/supabase-js'
import { timingSafeEqual } from 'node:crypto'

// Chamada por um Database Webhook do Supabase (insert em public.leads). Envia um email
// aos admins ativos quando o lead vem do site. Sem BREVO_API_KEY não envia nada, mas
// responde 200 para o Supabase não repetir o pedido. Envio pela API da Brevo, como em
// razao-dinamica/crm/api/utilizadores.js.

const RAMOS = {
  auto: 'Automóvel', vida: 'Vida', saude: 'Saúde', multirriscos: 'Multirriscos habitação',
  acidentes_trabalho: 'Acidentes de trabalho', outro: 'Outro',
}

// O conteúdo vem de um formulário público: nunca entra no HTML sem ser escapado.
export function escaparHtml(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}

function segredoCerto(recebido, esperado) {
  const a = Buffer.from(String(recebido ?? ''))
  const b = Buffer.from(String(esperado))
  return a.length === b.length && timingSafeEqual(a, b)
}

export function montarEmail(lead, crmUrl) {
  const ramo = RAMOS[lead.ramo_interesse] ?? lead.ramo_interesse
  const linhas = [
    ['Nome', lead.nome], ['Telefone', lead.telefone], ['Email', lead.email], ['Interesse', ramo],
  ].filter(([, v]) => v)
  const link = crmUrl ? new URL('/leads?responsavel=sem_responsavel', crmUrl).href : null
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a2a3d">
    <h2 style="color:#184070;margin:0 0 4px">Novo pedido pelo site</h2>
    <p style="color:#647184;margin:0 0 20px">Chegou um pedido de contacto que ainda não tem responsável.</p>
    <table style="border-collapse:collapse;margin-bottom:16px">${linhas.map(([k, v]) =>
      `<tr><td style="padding:4px 12px 4px 0;color:#647184">${k}</td><td style="padding:4px 0"><strong>${escaparHtml(v)}</strong></td></tr>`).join('')}</table>
    ${lead.mensagem ? `<p style="background:#f8fafc;border:1px solid #e1e7ee;border-radius:8px;padding:12px;white-space:pre-line">${escaparHtml(lead.mensagem)}</p>` : ''}
    ${link ? `<p style="margin:24px 0"><a href="${link}" style="background:#184070;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Abrir no CRM</a></p>` : ''}
    <p style="font-size:12px;color:#647184">BV Seguros · CRM interno</p></div>`
  const texto = `Novo pedido pelo site\n\n${linhas.map(([k, v]) => `${k}: ${v}`).join('\n')}${lead.mensagem ? `\n\nMensagem:\n${lead.mensagem}` : ''}${link ? `\n\nAbrir no CRM: ${link}` : ''}`
  return { assunto: `Novo pedido pelo site: ${String(lead.nome).slice(0, 80)}`, html, texto }
}

export function createHandler({ env = process.env, client = createClient, fetchImpl = fetch } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store')
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return res.status(405).json({ error: 'Método não permitido.' })
    }
    if (!env.AVISO_LEAD_SEGREDO || !segredoCerto(req.headers['x-aviso-segredo'], env.AVISO_LEAD_SEGREDO)) {
      return res.status(401).json({ error: 'Não autorizado.' })
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const lead = body?.record
    if (body?.type !== 'INSERT' || body?.table !== 'leads' || !lead) return res.status(200).json({ enviado: 0, motivo: 'ignorado' })
    if (lead.origem !== 'site') return res.status(200).json({ enviado: 0, motivo: 'não veio do site' })
    if (!env.BREVO_API_KEY || !env.BREVO_REMETENTE) return res.status(200).json({ enviado: 0, motivo: 'email não configurado' })

    const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL
    if (!url || !env.SUPABASE_SERVICE_ROLE_KEY) return res.status(503).json({ error: 'Falta a configuração do Supabase.' })
    const admin = client(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: admins, error } = await admin.from('profiles').select('nome, email').eq('is_admin', true).eq('ativo', true)
    if (error) return res.status(503).json({ error: 'Não foi possível obter os administradores.' })
    if (!admins?.length) return res.status(200).json({ enviado: 0, motivo: 'sem administradores ativos' })

    const email = montarEmail(lead, env.CRM_SITE_URL)
    const resposta = await fetchImpl('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': env.BREVO_API_KEY },
      body: JSON.stringify({
        sender: { name: 'BV Seguros · CRM', email: env.BREVO_REMETENTE },
        to: admins.map((a) => ({ email: a.email, name: a.nome })),
        subject: email.assunto,
        htmlContent: email.html,
        textContent: email.texto,
      }),
    }).catch(() => null)

    // 502: o Supabase regista a falha na lista de pedidos do webhook, para se poder ver.
    if (!resposta?.ok) return res.status(502).json({ error: 'O serviço de email recusou o envio.' })
    return res.status(200).json({ enviado: admins.length })
  }
}

export default createHandler()
