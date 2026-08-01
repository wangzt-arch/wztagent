import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBaseUrl = env.VITE_API_BASE_URL || 'https://api.agnes-ai.cn'

  return {
    plugins: [vue()],
    base: './',
    server: {
      port: 3000,
      strictPort: true,
      proxy: {
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/v1'),
          secure: true
        },
        '/agnesapi': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: true
        }
      }
    },
    build: {
      outDir: 'build',
      assetsDir: 'assets'
    }
  }
})
