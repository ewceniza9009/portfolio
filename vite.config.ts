import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-icons': ['lucide-react'],
        }
      }
    }
  },
  server: {
    host: '127.0.0.1',
    port: 9191,
    headers: {
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err: any, _req, _res) => {
            // Mute the annoying ECONNREFUSED noise when the backend is offline
            if (err.code === 'ECONNREFUSED') {
              return;
            }
            console.log('proxy error', err);
          });
        }
      }
    }
  }
})