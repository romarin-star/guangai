import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: './',
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://zhiguan.up.railway.app',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist'
  }
})
