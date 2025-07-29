/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react'
import { useLanguageTransition, useLanguageTransitionWithDuration } from '../useLanguageTransition'

// Mock the useTranslation hook
const mockSetLanguage = jest.fn()
const mockCurrentLanguage = 'zh-CN'

jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    currentLanguage: mockCurrentLanguage,
    setLanguage: mockSetLanguage,
  }),
}))

describe('useLanguageTransition', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
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

  it('should handle transition progress', () => {
    const { result } = renderHook(() => useLanguageTransition())

    // Simulate language change
    act(() => {
      // Trigger language change by updating the mock
      jest.mocked(mockSetLanguage).mockImplementation(() => {
        // Simulate language change
        Object.defineProperty(result.current, 'currentLanguage', {
          value: 'en',
          writable: true,
        })
      })
    })

    act(() => {
      result.current.switchLanguage('en')
    })

    // Progress should start at 0
    expect(result.current.transitionProgress).toBe(0)

    // Advance timers to see progress
    act(() => {
      jest.advanceTimersByTime(100)
    })

    expect(result.current.transitionProgress).toBeGreaterThan(0)
  })

  it('should complete transition after progress reaches 100', () => {
    const { result } = renderHook(() => useLanguageTransition())

    act(() => {
      result.current.switchLanguage('en')
    })

    // Advance timers to complete transition
    act(() => {
      jest.advanceTimersByTime(300)
    })

    expect(result.current.transitionProgress).toBe(100)
    expect(result.current.isTransitioning).toBe(false)
  })

  it('should handle transition errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
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
})

describe('useLanguageTransitionWithDuration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should initialize with default duration', () => {
    const { result } = renderHook(() => useLanguageTransitionWithDuration())

    expect(result.current.isTransitioning).toBe(false)
    expect(result.current.currentLanguage).toBe('zh-CN')
    expect(typeof result.current.switchLanguage).toBe('function')
  })

  it('should use custom duration', () => {
    const customDuration = 500
    const { result } = renderHook(() => useLanguageTransitionWithDuration(customDuration))

    act(() => {
      result.current.switchLanguage('en')
    })

    expect(result.current.isTransitioning).toBe(true)

    // Advance timers to complete transition
    act(() => {
      jest.advanceTimersByTime(customDuration)
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
      jest.advanceTimersByTime(200)
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
