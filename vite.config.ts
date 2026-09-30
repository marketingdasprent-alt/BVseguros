import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  // 5190 por omissão; PORT deixa correr um segundo servidor (ex.: preview do Claude) sem conflito.
  server: { port: Number(process.env.PORT) || 5190 },
})
