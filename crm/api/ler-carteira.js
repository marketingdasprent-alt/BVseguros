import { createClient } from '@supabase/supabase-js'

// Lê um documento (PDF, imagem, texto ou CSV fora do modelo) com o Gemini e devolve as linhas
// nas colunas do modelo de importação. A chave do Gemini fica só no servidor. O resultado não
// é importado aqui: volta ao browser e passa pela mesma validação de um CSV (src/lib/importacao.ts).

// Mesma ordem de MODELOS em src/lib/importacao.ts (o teste confirma).
export const COLUNAS = {
  clientes: {
    nome: 'nome completo da pessoa ou empresa',
    telefone: 'telefone ou telemóvel, só dígitos e o + inicial',
    email: 'email',
    nif: 'NIF / número de contribuinte, 9 dígitos',
    morada: 'morada completa numa linha',
    responsavel_email: 'email do mediador responsável, se o documento o indicar',
  },
  apolices: {
    nif_cliente: 'NIF do tomador do seguro, 9 dígitos',
    numero_apolice: 'número da apólice',
    ramo: 'um de: Automóvel, Vida, Saúde, Multirriscos habitação, Acidentes de trabalho, Outro',
    seguradora: 'nome da seguradora / companhia',
    premio_anual: 'prémio anual em euros, no formato 1234,56',
    data_inicio: 'data de início em dd/mm/aaaa',
    data_fim: 'data de fim / vencimento em dd/mm/aaaa',
    estado: 'um de: Ativa, Pendente, Cancelada, Expirada',
  },
}

const TIPOS_BINARIOS = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp'])
// A Vercel aceita até 4,5 MB por pedido; em base64 um ficheiro de 3 MB fica perto dos 4 MB.
export const MAX_BASE64 = 4_000_000
export const MAX_TEXTO = 1_000_000
const MODELO_PADRAO = 'gemini-2.5-flash'

export function montarPrompt(tipo) {
  const colunas = Object.entries(COLUNAS[tipo]).map(([c, d]) => `- ${c}: ${d}`).join('\n')
  return [
    `Extrai deste documento a lista de ${tipo === 'clientes' ? 'clientes' : 'apólices de seguro'} de uma corretora portuguesa.`,
    'Uma entrada por cliente/apólice, com estes campos:',
    colunas,
    'Regras: copia os valores tal como aparecem no documento, sem inventar nem completar nada.',
    'Um campo que não esteja no documento fica como texto vazio.',
    'Ignora totais, cabeçalhos repetidos e linhas que não sejam registos.',
  ].join('\n')
}

function esquema(tipo) {
  const campos = Object.keys(COLUNAS[tipo])
  return {
    type: 'OBJECT',
    properties: {
      linhas: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: Object.fromEntries(campos.map((c) => [c, { type: 'STRING' }])),
          required: campos,
          propertyOrdering: campos,
        },
      },
    },
    required: ['linhas'],
  }
}

// Resposta do Gemini → linhas de texto na ordem das colunas.
export function extrairLinhas(tipo, resposta) {
  const texto = resposta?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
  const json = JSON.parse(texto)
  const campos = Object.keys(COLUNAS[tipo])
  if (!Array.isArray(json?.linhas)) throw new Error('resposta sem linhas')
  return json.linhas.map((l) => campos.map((c) => (typeof l?.[c] === 'string' ? l[c].trim() : '')))
}

export function createHandler({ env = process.env, client = createClient, fetchImpl = fetch } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store')
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return res.status(405).json({ error: 'Método não permitido.' })
    }

    const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
    const chaveGemini = env.GEMINI_API_KEY
    if (!url || !serviceKey || !chaveGemini) {
      return res.status(503).json({ error: 'A leitura com IA ainda não foi configurada (falta a GEMINI_API_KEY no servidor).' })
    }

    const token = /^Bearer (\S+)$/i.exec(req.headers.authorization || '')?.[1]
    if (!token) return res.status(401).json({ error: 'Inicie sessão novamente.' })

    try {
      const admin = client(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
      const { data: auth, error: authError } = await admin.auth.getUser(token)
      if (authError || !auth?.user) return res.status(401).json({ error: 'Sessão inválida. Inicie sessão novamente.' })
      // Só o admin importa carteira (as funções importar_* também o exigem).
      const { data: autor } = await admin.from('profiles').select('is_admin, ativo').eq('id', auth.user.id).single()
      if (!autor?.ativo || !autor.is_admin) return res.status(403).json({ error: 'Só o administrador pode importar a carteira.' })

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const tipo = body?.tipo
      if (tipo !== 'clientes' && tipo !== 'apolices') return res.status(400).json({ error: 'Tipo de importação inválido.' })

      let parteDocumento
      if (typeof body.texto === 'string') {
        if (!body.texto.trim()) return res.status(400).json({ error: 'O ficheiro está vazio.' })
        if (body.texto.length > MAX_TEXTO) return res.status(413).json({ error: 'O ficheiro é demasiado grande para ler com IA. Divida-o em partes.' })
        parteDocumento = { text: `Documento:\n${body.texto}` }
      } else {
        if (!TIPOS_BINARIOS.has(body.mimeType)) return res.status(400).json({ error: 'Formato não suportado. Use PDF, imagem (PNG, JPG, WEBP), CSV ou texto.' })
        if (typeof body.dados !== 'string' || !body.dados) return res.status(400).json({ error: 'O ficheiro está vazio.' })
        if (body.dados.length > MAX_BASE64) return res.status(413).json({ error: 'O ficheiro tem mais de 3 MB. Divida-o em partes.' })
        parteDocumento = { inline_data: { mime_type: body.mimeType, data: body.dados } }
      }

      const modelo = env.GEMINI_MODEL || MODELO_PADRAO
      const resposta = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': chaveGemini },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [parteDocumento, { text: montarPrompt(tipo) }] }],
          generationConfig: { temperature: 0, responseMimeType: 'application/json', responseSchema: esquema(tipo) },
        }),
      })
      if (!resposta.ok) {
        const limite = resposta.status === 429
        return res.status(limite ? 429 : 502).json({
          error: limite ? 'O limite de leituras com IA foi atingido. Tente daqui a um minuto.' : 'A IA não conseguiu ler o documento. Tente novamente.',
        })
      }

      let linhas
      try {
        linhas = extrairLinhas(tipo, await resposta.json())
      } catch {
        return res.status(502).json({ error: 'A IA devolveu uma resposta que não foi possível ler. Tente novamente.' })
      }
      return res.status(200).json({ colunas: Object.keys(COLUNAS[tipo]), linhas })
    } catch {
      return res.status(400).json({ error: 'Não foi possível concluir o pedido. Verifique o ficheiro e tente novamente.' })
    }
  }
}

export default createHandler()
