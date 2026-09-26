import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Exposes the server to all network interfaces (LAN / Wi-Fi)
    port: 5173,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5002',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'ws://127.0.0.1:5002',
        ws: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
})
