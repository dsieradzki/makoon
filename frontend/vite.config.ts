import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import * as path from "path";
import { fileURLToPath, URL } from "url";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
  },
  resolve: {
    alias: {
      '@': path.resolve('src/'),
      '@wails': path.resolve('./wailsjs/go'),
      '@wails-runtime': path.resolve('./wailsjs/runtime')
    },
  }
})
