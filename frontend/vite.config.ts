import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // 开发环境代理配置，生产环境不需要
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:8765',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
      '/ws': {
        target: process.env.VITE_WS_URL || 'ws://localhost:8765',
        ws: true,
      },
    },
  },
})