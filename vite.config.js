import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl'
import path from 'path'

export default defineConfig(({ command }) => ({
  plugins: [
    vue(),
    // Only use SSL in dev mode, not for preview/build
    ...(command === 'serve' && !process.env.CI ? [basicSsl()] : [])
  ],
  base: '/',
  server: {
    https: command === 'serve' && !process.env.CI,
    cors: true  // Enable CORS for cross-origin requests
  },
  preview: {
    port: 5173
  },
  resolve: {
    alias: {
      'vue': 'vue/dist/vue.esm-bundler.js',
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**']
  }
}))
