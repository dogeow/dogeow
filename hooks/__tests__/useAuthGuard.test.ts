import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthGuard } from '../useAuthGuard'

// Mock dependencies using vi.hoisted
const { mockAuthStore, mockToastError, mockPush } = vi.hoisted(() => ({
  mockAuthStore: {
    isAuthenticated: false,
  },
  mockToastError: vi.fn(),
  mockPush: vi.fn(),
}))

vi.mock('@/stores/authStore', () => ({
  default: () => mockAuthStore,
}))

vi.mock('sonner', () => ({
  toast: {
    error: mockToastError,
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('useAuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthStore.isAuthenticated = false
  })

  describe('initialization', () => {
    it('should return authentication status', () => {
      mockAuthStore.isAuthenticated = true

      const { result } = renderHook(() => useAuthGuard())

      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should return false when not authenticated', () => {
      mockAuthStore.isAuthenticated = false

      const { result } = renderHook(() => useAuthGuard())

      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('checkAuth', () => {
    it('should return true when user is authenticated', () => {
      mockAuthStore.isAuthenticated = true

      const { result } = renderHook(() => useAuthGuard())

      const isAuth = result.current.checkAuth()
      expect(isAuth).toBe(true)
    })

    it('should return false and show toast when user is not authenticated', () => {
      mockAuthStore.isAuthenticated = false

      const { result } = renderHook(() => useAuthGuard())

      const isAuth = result.current.checkAuth()
      expect(isAuth).toBe(false)
      expect(mockToastError).toHaveBeenCalledWith('请先登录')
    })

    it('should redirect when redirectTo is provided', () => {
      mockAuthStore.isAuthenticated = false

      const { result } = renderHook(() => useAuthGuard())

      result.current.checkAuth({ redirectTo: '/login' })
      expect(mockPush).toHaveBeenCalledWith('/login')
    })

    it('should not show toast when showToast is false', () => {
      mockAuthStore.isAuthenticated = false

      const { result } = renderHook(() => useAuthGuard())

      result.current.checkAuth({ showToast: false })
      expect(mockToastError).not.toHaveBeenCalled()
    })

    it('should show custom toast message', () => {
      mockAuthStore.isAuthenticated = false

      const { result } = renderHook(() => useAuthGuard())

      result.current.checkAuth({ toastMessage: 'Custom message' })
      expect(mockToastError).toHaveBeenCalledWith('Custom message')
    })
  })

  describe('requireAuth', () => {
    it('should execute callback when user is authenticated', () => {
      mockAuthStore.isAuthenticated = true

      const mockCallback = vi.fn()

      const { result } = renderHook(() => useAuthGuard())

      result.current.requireAuth(mockCallback)
      expect(mockCallback).toHaveBeenCalled()
    })

    it('should not execute callback when user is not authenticated', () => {
      mockAuthStore.isAuthenticated = false

      const mockCallback = vi.fn()

      const { result } = renderHook(() => useAuthGuard())

      result.current.requireAuth(mockCallback)
      expect(mockCallback).not.toHaveBeenCalled()
      expect(mockToastError).toHaveBeenCalledWith('请先登录')
    })
  })

  describe('requireAuthAsync', () => {
    it('should execute async callback when user is authenticated', async () => {
      mockAuthStore.isAuthenticated = true

      const mockCallback = vi.fn().mockResolvedValue('success')

      const { result } = renderHook(() => useAuthGuard())

      await result.current.requireAuthAsync(mockCallback)
      expect(mockCallback).toHaveBeenCalled()
    })

    it('should not execute async callback when user is not authenticated', async () => {
      mockAuthStore.isAuthenticated = false

      const mockCallback = vi.fn()

      const { result } = renderHook(() => useAuthGuard())

      await result.current.requireAuthAsync(mockCallback)
      expect(mockCallback).not.toHaveBeenCalled()
      expect(mockToastError).toHaveBeenCalledWith('请先登录')
    })
  })
})
