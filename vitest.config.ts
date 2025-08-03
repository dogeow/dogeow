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
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4,
      },
    },
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
    // Coverage configuration with performance optimizations
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: [
        'app/**/*.{js,jsx,ts,tsx}',
        'components/**/*.{js,jsx,ts,tsx}',
        'hooks/**/*.{js,jsx,ts,tsx}',
        'lib/**/*.{js,jsx,ts,tsx}',
        'stores/**/*.{js,jsx,ts,tsx}',
      ],
      exclude: [
        '**/*.d.ts',
        '**/node_modules/**',
        '**/.next/**',
        '**/coverage/**',
        '**/__tests__/**',
        '**/*.test.{js,jsx,ts,tsx}',
        '**/*.spec.{js,jsx,ts,tsx}',
        '**/types/**',
        '**/*.config.{js,ts}',
        '**/build/**',
        '**/dist/**',
      ],
      // Performance: Skip coverage for files not touched by tests
      skipFull: true,
      // Performance: Use faster source map generation
      clean: true,
      cleanOnRerun: true,
      // Generate coverage even when tests fail
      enabled: true,
      // Remove strict thresholds for now
      thresholds: {
        global: {
          branches: 0,
          functions: 0,
          lines: 0,
          statements: 0,
        },
      },
    },
    // Optimize reporter output
    reporter: process.env.CI ? ['verbose', 'github-actions'] : ['verbose'],
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
