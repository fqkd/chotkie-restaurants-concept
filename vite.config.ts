import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? '/chotkie-restaurants-concept/' : '/',
  build: {
    rollupOptions: {
      input: {
        app: resolve(__dirname, 'index.html'),
        case: resolve(__dirname, 'case/index.html'),
      },
    },
  },
})
