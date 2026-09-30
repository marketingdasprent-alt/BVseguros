import { describe, expect, it } from 'vitest'
import { COLUNAS, createHandler, extrairLinhas, MAX_BASE64 } from '../api/ler-carteira.js'
import { MODELOS } from '../src/lib/importacao'

const ENV = { VITE_SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 's', GEMINI_API_KEY: 'g' }

function cliente({ admin = true } = {}) {
  const q = { select: () => q, eq: () => q, single: async () => ({ data: { is_admin: admin, ativo: true }, error: null }) }
  return () => ({ auth: { getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }) }, from: () => q })
}

function respostaGemini(linhas) {
  return { candidates: [{ content: { parts: [{ text: JSON.stringify({ linhas }) }] } }] }
}

function fetchFalso(resposta, ok = true, status = 200) {
  const pedidos = []
  const f = async (url, opcoes) => { pedidos.push({ url, opcoes, corpo: JSON.parse(opcoes.body) }); return { ok, status, json: async () => resposta } }
  return { f, pedidos }
}

async function pedir(handler, body, { token = 't' } = {}) {
  const res = { statusCode: 200, corpo: null, setHeader: () => {} }
  res.status = (c) => { res.statusCode = c; return res }
  res.json = (d) => { res.corpo = d; return res }
  await handler({ method: 'POST', headers: { authorization: token ? `Bearer ${token}` : '' }, body }, res)
  return res
}

describe('api/ler-carteira', () => {
  it('usa as mesmas colunas e ordem dos modelos de importação', () => {
    expect(Object.keys(COLUNAS.clientes)).toEqual(MODELOS.clientes.cabecalho)
    expect(Object.keys(COLUNAS.apolices)).toEqual(MODELOS.apolices.cabecalho)
  })

  it('sem GEMINI_API_KEY responde 503 sem chamar a IA', async () => {
    const { f, pedidos } = fetchFalso({})
    const res = await pedir(createHandler({ env: { ...ENV, GEMINI_API_KEY: '' }, client: cliente(), fetchImpl: f }), { tipo: 'clientes', texto: 'x' })
    expect(res.statusCode).toBe(503)
    expect(pedidos).toHaveLength(0)
  })

  it('recusa quem não é admin', async () => {
    const { f, pedidos } = fetchFalso({})
    const res = await pedir(createHandler({ env: ENV, client: cliente({ admin: false }), fetchImpl: f }), { tipo: 'clientes', texto: 'x' })
    expect(res.statusCode).toBe(403)
    expect(pedidos).toHaveLength(0)
  })

  it('recusa formatos e tamanhos fora do suportado', async () => {
    const { f } = fetchFalso({})
    const h = createHandler({ env: ENV, client: cliente(), fetchImpl: f })
    expect((await pedir(h, { tipo: 'clientes', mimeType: 'application/zip', dados: 'AA' })).statusCode).toBe(400)
    expect((await pedir(h, { tipo: 'clientes', mimeType: 'application/pdf', dados: 'A'.repeat(MAX_BASE64 + 1) })).statusCode).toBe(413)
    expect((await pedir(h, { tipo: 'outra', texto: 'x' })).statusCode).toBe(400)
  })

  it('envia o PDF ao Gemini e devolve as linhas na ordem das colunas', async () => {
    const { f, pedidos } = fetchFalso(respostaGemini([{ telefone: '912345678', nome: ' Ana Costa ', email: '', nif: '123456789', morada: '', responsavel_email: '' }]))
    const res = await pedir(createHandler({ env: ENV, client: cliente(), fetchImpl: f }), { tipo: 'clientes', mimeType: 'application/pdf', dados: 'JVBERi0=' })
    expect(res.statusCode).toBe(200)
    expect(res.corpo.colunas).toEqual(MODELOS.clientes.cabecalho)
    expect(res.corpo.linhas).toEqual([['Ana Costa', '912345678', '', '123456789', '', '']])
    expect(pedidos[0].opcoes.headers['x-goog-api-key']).toBe('g')
    expect(pedidos[0].corpo.contents[0].parts[0].inline_data).toEqual({ mime_type: 'application/pdf', data: 'JVBERi0=' })
  })

  it('traduz o limite da IA e respostas ilegíveis', async () => {
    const limite = fetchFalso({}, false, 429)
    expect((await pedir(createHandler({ env: ENV, client: cliente(), fetchImpl: limite.f }), { tipo: 'clientes', texto: 'x' })).statusCode).toBe(429)
    const lixo = fetchFalso({ candidates: [{ content: { parts: [{ text: 'não é json' }] } }] })
    expect((await pedir(createHandler({ env: ENV, client: cliente(), fetchImpl: lixo.f }), { tipo: 'clientes', texto: 'x' })).statusCode).toBe(502)
  })

  it('extrairLinhas ignora campos que não são texto', () => {
    expect(extrairLinhas('apolices', respostaGemini([{ nif_cliente: 123, numero_apolice: 'AP-1' }]))[0]).toEqual(['', 'AP-1', '', '', '', '', '', ''])
  })
})
