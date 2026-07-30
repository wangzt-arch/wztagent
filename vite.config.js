import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './',
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'https://api.agnes-ai.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/v1'),
        secure: true
      },
      '/agnesapi': {
        target: 'https://api.agnes-ai.cn',
        changeOrigin: true,
        secure: true
      }
    }
  },
  build: {
    outDir: 'build',
    assetsDir: 'assets'
  }
})
