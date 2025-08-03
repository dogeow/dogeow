import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import { useLanguageTransition, useLanguageTransitionWithDuration } from '../useLanguageTransition'

// Mock the useTranslation hook
const mockSetLanguage = vi.fn()
const mockCurrentLanguage = 'zh-CN'

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    currentLanguage: mockCurrentLanguage,
    setLanguage: mockSetLanguage,
  }),
}))

describe('useLanguageTransition', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useLanguageTransition())

    expect(result.current.isTransitioning).toBe(false)
    expect(result.current.transitionProgress).toBe(0)
    expect(result.current.currentLanguage).toBe('zh-CN')
    expect(typeof result.current.switchLanguage).toBe('function')
  })

  it('should handle language switching', async () => {
    const { result } = renderHook(() => useLanguageTransition())

    await act(async () => {
      await result.current.switchLanguage('en')
    })

    expect(mockSetLanguage).toHaveBeenCalledWith('en')
  })

  it('should not switch if language is the same', async () => {
    const { result } = renderHook(() => useLanguageTransition())

    await act(async () => {
      await result.current.switchLanguage('zh-CN')
    })

    expect(mockSetLanguage).not.toHaveBeenCalled()
  })

  it('should handle transition progress', async () => {
    const { result } = renderHook(() => useLanguageTransition())

    await act(async () => {
      await result.current.switchLanguage('en')
    })

    // Progress should start at 0
    expect(result.current.transitionProgress).toBe(0)

    // Advance timers to see progress (3 steps * 30ms = 90ms)
    act(() => {
      vi.advanceTimersByTime(90)
    })

    expect(result.current.transitionProgress).toBeGreaterThan(0)
    expect(result.current.transitionProgress).toBeLessThanOrEqual(30)
  })

  it('should complete transition after progress reaches 100', async () => {
    const { result } = renderHook(() => useLanguageTransition())

    await act(async () => {
      await result.current.switchLanguage('en')
    })

    // Advance timers to complete transition (10 steps * 30ms = 300ms)
    act(() => {
      vi.advanceTimersByTime(330)
    })

    expect(result.current.transitionProgress).toBe(100)
    expect(result.current.isTransitioning).toBe(false)
  })

  it('should handle transition errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockSetLanguage.mockRejectedValueOnce(new Error('Language switch failed'))

    const { result } = renderHook(() => useLanguageTransition())

    await act(async () => {
      await result.current.switchLanguage('en')
    })

    expect(consoleSpy).toHaveBeenCalledWith('Language switch failed:', expect.any(Error))
    expect(result.current.isTransitioning).toBe(false)
    expect(result.current.transitionProgress).toBe(0)

    consoleSpy.mockRestore()
  })

  it('should force completion after timeout (3 seconds)', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const { result } = renderHook(() => useLanguageTransition())

    await act(async () => {
      await result.current.switchLanguage('en')
    })

    expect(result.current.isTransitioning).toBe(true)

    // Advance timers to trigger the 3-second timeout
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(consoleSpy).toHaveBeenCalledWith('Transition timeout, forcing completion')
    expect(result.current.isTransitioning).toBe(false)
    expect(result.current.transitionProgress).toBe(100)

    consoleSpy.mockRestore()
  })

  it('should handle cleanup and prevent memory leaks', async () => {
    const { result, unmount } = renderHook(() => useLanguageTransition())

    await act(async () => {
      await result.current.switchLanguage('en')
    })

    expect(result.current.isTransitioning).toBe(true)

    // Unmount the component while transition is in progress
    unmount()

    // Advance timers to ensure intervals are cleared
    act(() => {
      vi.advanceTimersByTime(5000)
    })

    // No errors should occur and timers should be cleaned up
    expect(vi.getTimerCount()).toBe(0)
  })

  it('should handle multiple rapid language switches', async () => {
    const { result } = renderHook(() => useLanguageTransition())

    // Start first transition
    await act(async () => {
      await result.current.switchLanguage('en')
    })

    expect(result.current.isTransitioning).toBe(true)

    // Start second transition before first completes
    await act(async () => {
      await result.current.switchLanguage('fr')
    })

    expect(mockSetLanguage).toHaveBeenCalledTimes(2)
    expect(mockSetLanguage).toHaveBeenLastCalledWith('fr')

    // Complete transitions
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.isTransitioning).toBe(false)
  })

  it('should handle transition state changes correctly', async () => {
    const { result } = renderHook(() => useLanguageTransition())

    // Initial state
    expect(result.current.isTransitioning).toBe(false)
    expect(result.current.transitionProgress).toBe(0)

    // Start transition
    await act(async () => {
      await result.current.switchLanguage('en')
    })

    expect(result.current.isTransitioning).toBe(true)
    expect(result.current.transitionProgress).toBe(0)

    // Progress through transition
    act(() => {
      vi.advanceTimersByTime(150) // 5 steps * 30ms = 150ms
    })

    expect(result.current.transitionProgress).toBe(50)
    expect(result.current.isTransitioning).toBe(true)

    // Complete transition naturally
    act(() => {
      vi.advanceTimersByTime(180) // Complete remaining steps
    })

    expect(result.current.transitionProgress).toBe(100)
    expect(result.current.isTransitioning).toBe(false)
  })
})

describe('useLanguageTransitionWithDuration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default duration', () => {
    const { result } = renderHook(() => useLanguageTransitionWithDuration())

    expect(result.current.isTransitioning).toBe(false)
    expect(result.current.currentLanguage).toBe('zh-CN')
    expect(typeof result.current.switchLanguage).toBe('function')
  })

  it('should use custom duration', async () => {
    const customDuration = 500
    const { result } = renderHook(() => useLanguageTransitionWithDuration(customDuration))

    await act(async () => {
      await result.current.switchLanguage('en')
    })

    expect(result.current.isTransitioning).toBe(true)

    // Advance timers to complete transition
    act(() => {
      vi.advanceTimersByTime(customDuration)
    })

    expect(result.current.isTransitioning).toBe(false)
  })

  it('should handle language switching with custom duration', async () => {
    const { result } = renderHook(() => useLanguageTransitionWithDuration(200))

    await act(async () => {
      await result.current.switchLanguage('en')
    })

    expect(mockSetLanguage).toHaveBeenCalledWith('en')
    expect(result.current.isTransitioning).toBe(true)

    // Complete transition
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current.isTransitioning).toBe(false)
  })

  it('should not switch if language is the same', async () => {
    const { result } = renderHook(() => useLanguageTransitionWithDuration())

    await act(async () => {
      await result.current.switchLanguage('zh-CN')
    })

    expect(mockSetLanguage).not.toHaveBeenCalled()
    expect(result.current.isTransitioning).toBe(false)
  })
})
