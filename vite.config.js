import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Set BASE_URL env var to your repo name for GitHub Pages subdirectory deploys
// e.g. VITE_BASE=/elite-sleep-pwa/ npm run build
// For root domain deploys (custom domain / username.github.io) leave as './'
const base = process.env.VITE_BASE || './'

export default defineConfig({
  plugins: [react()],
  base:'/Sono-monitor/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Stable chunk names — no content hashes breaking SW cache
        entryFileNames:   'assets/[name].js',
        chunkFileNames:   'assets/[name].js',
        assetFileNames:   'assets/[name].[ext]',
      },
    },
  },
})
