import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import * as path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
  },
  resolve: {
    alias: {
      '@': path.resolve('src/'),
    },
  },
  server: {
    host: "0.0.0.0",
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        secure: false,
        ws: true,
      }
    }
  }
})
