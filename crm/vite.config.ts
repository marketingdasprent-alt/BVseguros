import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { localApi } from './server/local-api.js'

export default defineConfig(({ mode }) => {
  // Prefixo '' para o /api local ler também SUPABASE_SERVICE_ROLE_KEY do .env.local (nunca vai para o bundle).
  const env = { ...loadEnv(mode, __dirname, ''), ...process.env }
  return {
    plugins: [
      react(),
      { name: 'crm-api-local', configureServer: (server) => { server.middlewares.use(localApi(env)) } },
    ],
    server: { port: 5183 },
    resolve: {
      alias: { '@': path.resolve(__dirname, 'src') },
    },
  }
})
