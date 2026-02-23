import { defineConfig } from 'vitest/config'
import baseConfig from './vitest.config'

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    // CI-specific optimizations
    reporters: ['verbose', 'junit'],
    outputFile: {
      junit: './test-results/junit.xml',
    },
    // Stricter timeouts for CI
    testTimeout: 15000,
    hookTimeout: 15000,
    // Retry failed tests in CI
    retry: 2,
    // Bail on first failure in CI for faster feedback
    bail: 1,
  },
})
