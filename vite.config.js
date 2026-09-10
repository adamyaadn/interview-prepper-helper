import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' keeps all asset URLs relative, so the build works as-is
// whether it's served from a custom domain or https://<user>.github.io/<repo>/
export default defineConfig({
  plugins: [react()],
  base: './',
})
