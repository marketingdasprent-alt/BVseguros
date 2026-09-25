import { describe, expect, it } from 'vitest'
import { createHandler, escaparHtml, montarEmail } from '../api/aviso-lead.js'

const ENV = {
  AVISO_LEAD_SEGREDO: 'segredo-certo', BREVO_API_KEY: 'k', BREVO_REMETENTE: 'crm@bv.pt',
  VITE_SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 's', CRM_SITE_URL: 'https://crm.bv.pt',
}
const LEAD = { nome: 'Ana <b>Costa</b>', telefone: '912345678', email: 'ana@x.pt', ramo_interesse: 'auto', origem: 'site', mensagem: '<script>alert(1)</script>' }

function cliente(admins = [{ nome: 'Admin', email: 'admin@bv.pt' }]) {
  const q = { select: () => q, eq: () => q, then: (ok) => ok({ data: admins, error: null }) }
  return () => ({ from: () => q })
}

function fetchFalso(ok = true) {
  const envios = []
  const f = async (url, opcoes) => { envios.push({ url, corpo: JSON.parse(opcoes.body) }); return { ok } }
  return { f, envios }
}

async function pedir(handler, { segredo = 'segredo-certo', body = { type: 'INSERT', table: 'leads', record: LEAD } } = {}) {
  const res = { statusCode: 200, corpo: null, setHeader: () => {} }
  res.status = (c) => { res.statusCode = c; return res }
  res.json = (d) => { res.corpo = d; return res }
  await handler({ method: 'POST', headers: { 'x-aviso-segredo': segredo }, body }, res)
  return res
}

describe('api/aviso-lead', () => {
  it('recusa pedidos sem o segredo certo', async () => {
    const { f, envios } = fetchFalso()
    const h = createHandler({ env: ENV, client: cliente(), fetchImpl: f })
    expect((await pedir(h, { segredo: 'errado' })).statusCode).toBe(401)
    expect((await pedir(h, { segredo: null })).statusCode).toBe(401)
    expect(envios).toHaveLength(0)
  })

  it('ignora leads que não vêm do site', async () => {
    const { f, envios } = fetchFalso()
    const res = await pedir(createHandler({ env: ENV, client: cliente(), fetchImpl: f }), { body: { type: 'INSERT', table: 'leads', record: { ...LEAD, origem: 'manual' } } })
    expect(res.corpo.enviado).toBe(0)
    expect(envios).toHaveLength(0)
  })

  it('sem Brevo configurada responde 200 sem enviar (o Supabase não repete)', async () => {
    const { f, envios } = fetchFalso()
    const res = await pedir(createHandler({ env: { ...ENV, BREVO_API_KEY: '' }, client: cliente(), fetchImpl: f }))
    expect(res.statusCode).toBe(200)
    expect(envios).toHaveLength(0)
  })

  it('envia aos admins ativos com o link para os leads sem responsável', async () => {
    const { f, envios } = fetchFalso()
    const res = await pedir(createHandler({ env: ENV, client: cliente([{ nome: 'A', email: 'a@bv.pt' }, { nome: 'B', email: 'b@bv.pt' }]), fetchImpl: f }))
    expect(res.corpo.enviado).toBe(2)
    expect(envios[0].corpo.to.map((t) => t.email)).toEqual(['a@bv.pt', 'b@bv.pt'])
    expect(envios[0].corpo.htmlContent).toContain('https://crm.bv.pt/leads?responsavel=sem_responsavel')
  })

  it('502 quando a Brevo recusa, para a falha ficar registada no Supabase', async () => {
    const { f } = fetchFalso(false)
    expect((await pedir(createHandler({ env: ENV, client: cliente(), fetchImpl: f }))).statusCode).toBe(502)
  })
})

describe('montarEmail', () => {
  it('escapa o que vem do formulário público', () => {
    const { html } = montarEmail(LEAD, 'https://crm.bv.pt')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('Ana &lt;b&gt;Costa&lt;/b&gt;')
  })

  it('escaparHtml trata aspas e &', () => {
    expect(escaparHtml(`"a" & 'b'`)).toBe('&quot;a&quot; &amp; &#39;b&#39;')
  })
})
