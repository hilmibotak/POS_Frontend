import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import oxlint from 'vite-plugin-oxlint'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    oxlint(),
  ],
})