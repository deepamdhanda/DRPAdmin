import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      '5f99fb5d52d0.ngrok-free.app', // add your ngrok domain here
      'localhost',
      '127.0.0.1',
    ],
  },
})
