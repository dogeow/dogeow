import '@testing-library/jest-dom'

// Extend Vitest's expect with jest-dom matchers
declare module 'vitest' {
  // Extend with additional matchers if needed
}

// Global types for Vitest when using globals: true
declare global {
  const describe: typeof import('vitest').describe
  const it: typeof import('vitest').it
  const test: typeof import('vitest').test
  const expect: typeof import('vitest').expect
  const beforeAll: typeof import('vitest').beforeAll
  const afterAll: typeof import('vitest').afterAll
  const beforeEach: typeof import('vitest').beforeEach
  const afterEach: typeof import('vitest').afterEach
  const vi: typeof import('vitest').vi

  // Mock types for compatibility
  namespace jest {
    type MockedFunction<T extends (...args: unknown[]) => unknown> =
      import('vitest').MockedFunction<T>
    const fn: typeof vi.fn
    const mock: typeof vi.mock
    const spyOn: typeof vi.spyOn
    const clearAllMocks: typeof vi.clearAllMocks
    const resetAllMocks: typeof vi.resetAllMocks
    const restoreAllMocks: typeof vi.restoreAllMocks
    const mocked: typeof vi.mocked
    const useFakeTimers: typeof vi.useFakeTimers
    const useRealTimers: typeof vi.useRealTimers
    const advanceTimersByTime: typeof vi.advanceTimersByTime
  }
}
