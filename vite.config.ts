import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'dotenv-reload',
      handleHotUpdate({ file, server }) {
        if (file.endsWith('.env')) {
          console.log('⟳ .env changed — restarting server')
          server.restart()
        }
      },
    },
  ],
  server: {
    port: 5175,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
