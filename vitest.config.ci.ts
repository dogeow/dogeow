import { defineConfig } from 'vitest/config'
import baseConfig from './vitest.config'

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    // CI-specific optimizations
    reporter: ['verbose', 'junit'],
    outputFile: {
      junit: './test-results/junit.xml',
    },
    // Increase parallelism for CI
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 2,
        maxThreads: 8, // Higher for CI environments
      },
    },
    // Stricter timeouts for CI
    testTimeout: 15000,
    hookTimeout: 15000,
    // Ensure coverage is collected in CI
    coverage: {
      ...baseConfig.test?.coverage,
      reporter: ['text', 'json', 'lcov', 'clover'],
      // Fail CI if coverage is too low - 100% coverage requirement
      thresholds: {
        global: {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
      },
    },
    // Retry failed tests in CI
    retry: 2,
    // Bail on first failure in CI for faster feedback
    bail: 1,
  },
})
