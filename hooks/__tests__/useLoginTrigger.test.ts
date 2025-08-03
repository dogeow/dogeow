import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useLoginTrigger } from '../useLoginTrigger'

// Mock dependencies using vi.hoisted
const { mockAuthStore, mockToastError } = vi.hoisted(() => ({
  mockAuthStore: {
    isAuthenticated: false,
  },
  mockToastError: vi.fn(),
}))

vi.mock('@/stores/authStore', () => ({
  default: () => mockAuthStore,
}))

vi.mock('sonner', () => ({
  toast: {
    error: mockToastError,
  },
}))

describe('useLoginTrigger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockAuthStore.isAuthenticated = false
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with authentication status', () => {
      mockAuthStore.isAuthenticated = false

      const { result } = renderHook(() => useLoginTrigger())

      expect(result.current.isAuthenticated).toBe(false)
      expect(typeof result.current.triggerLogin).toBe('function')
      expect(typeof result.current.requireLogin).toBe('function')
      expect(typeof result.current.requireLoginAsync).toBe('function')
    })
  })

  describe('triggerLogin', () => {
    it('should return true when user is authenticated', () => {
      mockAuthStore.isAuthenticated = true

      const { result } = renderHook(() => useLoginTrigger())

      const success = result.current.triggerLogin()

      expect(success).toBe(true)
      expect(mockToastError).not.toHaveBeenCalled()
    })

    it('should show toast when user is not authenticated', () => {
      mockAuthStore.isAuthenticated = false

      const { result } = renderHook(() => useLoginTrigger())

      const success = result.current.triggerLogin()

      expect(success).toBe(false)
      expect(mockToastError).toHaveBeenCalledWith('请先登录', {
        description: '正在为您打开登录界面...',
        duration: 2000,
      })
    })

    it('should attempt to find login button after timeout', () => {
      mockAuthStore.isAuthenticated = false

      // Mock document methods
      const mockQuerySelector = vi.fn(() => null)
      const mockQuerySelectorAll = vi.fn(() => [] as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      const mockGetElementById = vi.fn(() => null)

      // Store original methods
      const originalQuerySelector = document.querySelector
      const originalQuerySelectorAll = document.querySelectorAll
      const originalGetElementById = document.getElementById

      // Replace methods
      document.querySelector = mockQuerySelector as any // eslint-disable-line @typescript-eslint/no-explicit-any
      document.querySelectorAll = mockQuerySelectorAll as any // eslint-disable-line @typescript-eslint/no-explicit-any
      document.getElementById = mockGetElementById as any // eslint-disable-line @typescript-eslint/no-explicit-any

      try {
        const { result } = renderHook(() => useLoginTrigger())

        result.current.triggerLogin()

        act(() => {
          vi.advanceTimersByTime(100)
        })

        expect(mockQuerySelector).toHaveBeenCalledWith('[data-login-trigger]')
      } finally {
        // Restore original methods
        document.querySelector = originalQuerySelector
        document.querySelectorAll = originalQuerySelectorAll
        document.getElementById = originalGetElementById
      }
    })
  })

  describe('requireLogin', () => {
    it('should execute callback when user is authenticated', () => {
      mockAuthStore.isAuthenticated = true

      const callback = vi.fn()
      const { result } = renderHook(() => useLoginTrigger())

      result.current.requireLogin(callback)

      expect(callback).toHaveBeenCalled()
      expect(mockToastError).not.toHaveBeenCalled()
    })

    it('should not execute callback when user is not authenticated', () => {
      mockAuthStore.isAuthenticated = false

      const callback = vi.fn()
      const { result } = renderHook(() => useLoginTrigger())

      result.current.requireLogin(callback)

      expect(callback).not.toHaveBeenCalled()
      expect(mockToastError).toHaveBeenCalledWith('请先登录', {
        description: '正在为您打开登录界面...',
        duration: 2000,
      })
    })
  })

  describe('requireLoginAsync', () => {
    it('should execute async callback when user is authenticated', async () => {
      mockAuthStore.isAuthenticated = true

      const callback = vi.fn().mockResolvedValue(undefined)
      const { result } = renderHook(() => useLoginTrigger())

      await result.current.requireLoginAsync(callback)

      expect(callback).toHaveBeenCalled()
      expect(mockToastError).not.toHaveBeenCalled()
    })

    it('should not execute async callback when user is not authenticated', async () => {
      mockAuthStore.isAuthenticated = false

      const callback = vi.fn().mockResolvedValue(undefined)
      const { result } = renderHook(() => useLoginTrigger())

      await result.current.requireLoginAsync(callback)

      expect(callback).not.toHaveBeenCalled()
      expect(mockToastError).toHaveBeenCalledWith('请先登录', {
        description: '正在为您打开登录界面...',
        duration: 2000,
      })
    })

    it('should handle async callback that throws error', async () => {
      mockAuthStore.isAuthenticated = true

      const error = new Error('Async error')
      const callback = vi.fn().mockRejectedValue(error)
      const { result } = renderHook(() => useLoginTrigger())

      await expect(result.current.requireLoginAsync(callback)).rejects.toThrow('Async error')
      expect(callback).toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle document methods throwing errors', () => {
      mockAuthStore.isAuthenticated = false

      // Mock document methods to throw errors
      const originalQuerySelector = document.querySelector
      const originalQuerySelectorAll = document.querySelectorAll
      const originalGetElementById = document.getElementById

      document.querySelector = vi.fn(() => {
        throw new Error('DOM error')
      }) as any // eslint-disable-line @typescript-eslint/no-explicit-any
      document.querySelectorAll = vi.fn(() => {
        throw new Error('DOM error')
      }) as any // eslint-disable-line @typescript-eslint/no-explicit-any
      document.getElementById = vi.fn(() => {
        throw new Error('DOM error')
      }) as any // eslint-disable-line @typescript-eslint/no-explicit-any

      try {
        const { result } = renderHook(() => useLoginTrigger())

        expect(() => result.current.triggerLogin()).not.toThrow()
      } finally {
        // Restore original methods
        document.querySelector = originalQuerySelector
        document.querySelectorAll = originalQuerySelectorAll
        document.getElementById = originalGetElementById
      }
    })
  })
})
