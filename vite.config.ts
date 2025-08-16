import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages部署需要设置正确的base路径
  base: process.env.NODE_ENV === 'production' ? '/demo/' : '/',
  resolve: {
    alias: {
      buffer: 'buffer/'
    }
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => ['w3m-button', 'w3m-network-button'].includes(tag),
        },
      },
    }),
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue'],
          reown: ['@reown/appkit', '@reown/appkit-adapter-wagmi'],
          wagmi: ['@wagmi/vue', 'viem']
        }
      }
    }
  }
})
