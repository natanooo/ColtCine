import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api/pf/': {
        target: 'https://playerflix.ink',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/pf\//, ''),
      },
      '/api/wp/': {
        target: 'https://watchplayer.xyz',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/wp\//, ''),
      },
    },
  },
})
