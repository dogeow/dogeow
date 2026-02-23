import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    css: true,
    // Performance optimizations
    pool: 'threads',
    // Optimize test discovery and execution
    include: ['**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      '**/.nuxt/**',
      '**/.output/**',
      '**/.vitepress/cache/**',
    ],
    // Watch mode optimizations (watchExclude is not a valid Vitest option)
    // Files to exclude are handled by the exclude option above
    // Timeout optimizations
    testTimeout: 10000,
    hookTimeout: 10000,
    // Optimize test isolation
    isolate: true,
    // Optimize reporter output
    reporters: process.env.CI ? ['verbose', 'github-actions'] : ['verbose'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  // Cache optimizations (using Vite's cacheDir)
  cacheDir: 'node_modules/.vitest',
  // Optimize build performance
  esbuild: {
    target: 'node14',
  },
})
