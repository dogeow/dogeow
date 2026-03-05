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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary', 'clover'],
      reportsDirectory: './coverage',
      // 聚焦已建立测试的组件层级，减少历史目录的覆盖率噪音
      include: [
        'app/thing/components/*.{ts,tsx}',
        'app/thing/components/filters/**/*.{ts,tsx}',
        'app/thing/components/item-detail/*.{ts,tsx}',
        'app/thing/components/location-combobox/**/*.{ts,tsx}',
        'app/thing/components/location-tree/**/*.{ts,tsx}',
      ],
      exclude: [
        '**/__tests__/**',
        '**/*.test.*',
        '**/*.spec.*',
        '**/*.d.ts',
        'app/thing/components/**/index.ts',
        'app/thing/components/**/types.ts',
        // 兼容导出壳文件与旧实现，暂不纳入覆盖率统计
        'app/thing/components/AutoSaveStatus.tsx',
        'app/thing/components/CreateTagDialog.tsx',
        'app/thing/components/LoadingState.tsx',
        'app/thing/components/EnhancedSearchInput.tsx',
        'app/thing/components/ItemDetailModal.tsx',
        'app/thing/components/ItemRelationSelector.tsx',
        'app/thing/components/ItemRelationsDisplay.tsx',
        'app/thing/components/filters/BasicFilters.tsx',
      ],
    },
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
