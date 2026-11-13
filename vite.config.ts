import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    // Timeweb публикует сайт в корне; подпапка GitHub Pages задаётся в workflow.
    base: env.VITE_BASE_PATH || '/',
    plugins: [react(), tailwindcss()],
    build: { target: 'es2022' },
  }
})
