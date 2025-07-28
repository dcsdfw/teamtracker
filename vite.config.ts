import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
})
