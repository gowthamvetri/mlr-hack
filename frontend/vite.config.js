import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Chunk splitting strategy for optimal caching
    rollupOptions: {
      output: {
        manualChunks: {
          // React core - rarely changes, cached long-term
          'vendor-react': ['react', 'react-dom'],
          // Routing - separate chunk
          'vendor-router': ['react-router-dom'],
          // State management
          'vendor-redux': ['@reduxjs/toolkit', 'react-redux'],
          // Icons - tree-shakeable but used across app
          'vendor-icons': ['lucide-react'],
          // HTTP client
          'vendor-http': ['axios'],
        },
      },
    },
    // Adjust warning limit after code-splitting
    chunkSizeWarningLimit: 250,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
})
