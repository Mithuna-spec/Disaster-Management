import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    proxy: {
      '/auth': 'http://127.0.0.1:8000',
      '/disasters': 'http://127.0.0.1:8000',
      '/emergency-requests': 'http://127.0.0.1:8000',
      '/tasks': 'http://127.0.0.1:8000',
      '/volunteers': 'http://127.0.0.1:8000',
      '/resources': 'http://127.0.0.1:8000',
      '/notifications': 'http://127.0.0.1:8000',
      '/audit-logs': 'http://127.0.0.1:8000',
      '/me': 'http://127.0.0.1:8000',
      '/health': 'http://127.0.0.1:8000'
    }
  }
})
