import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load environment variables from .env file based on mode
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        // Proxy API requests to the backend server
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
          secure: false, // Set to true for HTTPS backend
        },
        // Proxy Socket.IO requests to the backend server
        '/socket.io': {
          target: env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
          ws: true, // Enable WebSocket proxy
          secure: false, // Set to true for HTTPS backend
        }
      }
    },
    // Define global variables for client-side code
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.REACT_APP_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:3001'),
    }
  }
})