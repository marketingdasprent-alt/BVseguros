import { createHandler as utilizadores } from '../api/utilizadores.js'
import { createHandler as avisoLead } from '../api/aviso-lead.js'

// Em desenvolvimento, o Vite não corre as funções de /api: este adaptador executa os
// mesmos handlers da Vercel. Só é importado pelo vite.config.ts, nunca pelo frontend.
export function localApi(env) {
  const rotas = {
    '/api/utilizadores': utilizadores({ env }),
    '/api/aviso-lead': avisoLead({ env }),
  }
  return async (req, res, next) => {
    const handler = rotas[req.url?.split('?')[0]]
    if (!handler) return next()
    const reply = (code, data) => {
      res.statusCode = code
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
      res.end(JSON.stringify(data))
    }
    if (req.method === 'POST' || req.method === 'DELETE') {
      try {
        const chunks = []
        let size = 0
        for await (const chunk of req) {
          size += Buffer.byteLength(chunk)
          if (size > 16384) return reply(413, { error: 'Pedido demasiado grande.' })
          chunks.push(Buffer.from(chunk))
        }
        req.body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
      } catch {
        return reply(400, { error: 'Dados inválidos.' })
      }
    }
    res.status = (code) => { res.statusCode = code; return res }
    res.json = (data) => reply(res.statusCode, data)
    try {
      await handler(req, res)
    } catch {
      reply(500, { error: 'Não foi possível processar o pedido.' })
    }
  }
}
