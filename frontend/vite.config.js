import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  define: {
    global: 'globalThis',
    'process.env': {},
    'Buffer': ['buffer', 'Buffer'],
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      stream: 'stream-browserify',
      util: 'util',
    },
  },
  optimizeDeps: {
    include: [
      'buffer',
      'bn.js',
      'ethers/lib/utils',
      'web3modal',
      'stream-browserify',
      'util'
    ],
    exclude: []
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        globals: {
          buffer: 'Buffer'
        }
      }
    },
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
})
