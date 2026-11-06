import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig(({ command, isPreview }) => ({
  // Project Pages размещает сайт в подпапке с именем репозитория.
  base: command === 'build' || isPreview ? '/beauty-dynastya-2.0/' : '/',
  plugins: [react(), tailwindcss()],
  build: { target: 'es2022' },
}))
