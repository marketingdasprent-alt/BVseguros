import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'
import { createHandler } from './api/pedido'

// Em desenvolvimento o Vite não corre as funções de /api: este plugin corre o mesmo
// handler da Vercel. Lê o .env.local sem prefixo VITE_ (a service_role nunca vai para o bundle).
function apiLocal(env: Record<string, string>): Plugin {
  const pedido = createHandler({ env })
  return {
    name: 'site-api-local',
    configureServer(server) {
      server.middlewares.use('/api/pedido', async (req, res) => {
        const partes: Buffer[] = []
        let tamanho = 0
        for await (const parte of req) {
          tamanho += parte.length
          if (tamanho > 20_000) break
          partes.push(parte as Buffer)
        }
        let codigo = 200
        const resposta = {
          status(c: number) { codigo = c; return resposta },
          json(dados: unknown) {
            res.statusCode = codigo
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify(dados))
          },
          setHeader(nome: string, valor: string) { res.setHeader(nome, valor) },
        }
        // Localmente não há x-real-ip: o endereço da ligação faz esse papel.
        const headers = { ...req.headers, 'x-real-ip': req.socket.remoteAddress ?? '127.0.0.1' }
        await pedido({ method: req.method, headers, body: Buffer.concat(partes).toString('utf8') }, resposta)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // Absoluto: com './' as páginas em subcaminho (/seguros/automovel) pediam /seguros/assets/… e,
  // ao abrir o link direto ou recarregar, a Vercel devolvia o index.html em vez do script.
  base: '/',
  plugins: [react(), tailwindcss(), apiLocal({ ...loadEnv(mode, process.cwd(), ''), ...(process.env as Record<string, string>) })],
  // 5190 por omissão; PORT deixa correr um segundo servidor (ex.: preview do Claude) sem conflito.
  server: { port: Number(process.env.PORT) || 5190 },
}))
