import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import { useAvatarImage } from '../useAvatarImage'

describe('useAvatarImage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const defaultProps = {
    seed: 'test-user',
    fallbackInitials: 'TU',
  }

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useAvatarImage(defaultProps))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.hasError).toBe(false)
    expect(result.current.src).toBe('https://api.dicebear.com/7.x/avataaars/svg?seed=test-user')
    expect(typeof result.current.onError).toBe('function')
    expect(typeof result.current.onLoad).toBe('function')
  })

  it('should generate correct avatar URL with encoded seed', () => {
    const { result } = renderHook(() =>
      useAvatarImage({
        seed: 'user with spaces',
        fallbackInitials: 'UWS',
      })
    )

    expect(result.current.src).toBe(
      'https://api.dicebear.com/7.x/avataaars/svg?seed=user%20with%20spaces'
    )
  })

  it('should handle special characters in seed', () => {
    const { result } = renderHook(() =>
      useAvatarImage({
        seed: 'user@example.com',
        fallbackInitials: 'UE',
      })
    )

    expect(result.current.src).toBe(
      'https://api.dicebear.com/7.x/avataaars/svg?seed=user%40example.com'
    )
  })

  it('should reset state when seed changes', () => {
    const { result, rerender } = renderHook(props => useAvatarImage(props), {
      initialProps: defaultProps,
    })

    // Simulate error state
    act(() => {
      result.current.onError()
    })

    expect(result.current.isLoading).toBe(false)

    // Change seed
    rerender({
      seed: 'new-user',
      fallbackInitials: 'NU',
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.hasError).toBe(false)
    expect(result.current.src).toBe('https://api.dicebear.com/7.x/avataaars/svg?seed=new-user')
  })

  it('should handle successful image load', () => {
    const { result } = renderHook(() => useAvatarImage(defaultProps))

    expect(result.current.isLoading).toBe(true)

    act(() => {
      result.current.onLoad()
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.hasError).toBe(false)
  })

  it('should handle image error and try first fallback', () => {
    const { result } = renderHook(() => useAvatarImage(defaultProps))

    act(() => {
      result.current.onError()
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.hasError).toBe(false)
    expect(result.current.src).toBe(
      'https://ui-avatars.com/api/?name=TU&background=random&color=fff&size=128'
    )
    expect(console.error).toHaveBeenCalledWith(
      'Avatar image failed to load:',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=test-user'
    )
    expect(console.log).toHaveBeenCalledWith(
      'Trying fallback URL:',
      'https://ui-avatars.com/api/?name=TU&background=random&color=fff&size=128'
    )
  })

  it('should handle multiple image errors and try all fallbacks', () => {
    const { result } = renderHook(() => useAvatarImage(defaultProps))

    // First error - should try first fallback
    act(() => {
      result.current.onError()
    })

    expect(result.current.src).toBe(
      'https://ui-avatars.com/api/?name=TU&background=random&color=fff&size=128'
    )
    expect(result.current.hasError).toBe(false)

    // Second error - should try second fallback
    act(() => {
      result.current.onError()
    })

    expect(result.current.src).toBe('https://robohash.org/test-user.png?size=128x128&set=set1')
    expect(result.current.hasError).toBe(false)
    expect(console.log).toHaveBeenCalledWith(
      'Trying fallback URL:',
      'https://robohash.org/test-user.png?size=128x128&set=set1'
    )
  })

  it('should set error state when all fallbacks fail', () => {
    const { result } = renderHook(() => useAvatarImage(defaultProps))

    // Trigger all fallbacks
    act(() => {
      result.current.onError() // Primary fails
    })
    act(() => {
      result.current.onError() // First fallback fails
    })
    act(() => {
      result.current.onError() // Second fallback fails
    })

    expect(result.current.hasError).toBe(true)
    expect(result.current.src).toBe(null)
    expect(result.current.isLoading).toBe(false)
    expect(console.log).toHaveBeenCalledWith('All avatar URLs failed, showing fallback')
  })

  it('should encode fallback initials correctly', () => {
    const { result } = renderHook(() =>
      useAvatarImage({
        seed: 'test',
        fallbackInitials: 'A B',
      })
    )

    act(() => {
      result.current.onError()
    })

    expect(result.current.src).toBe(
      'https://ui-avatars.com/api/?name=A%20B&background=random&color=fff&size=128'
    )
  })

  it('should encode seed for robohash fallback correctly', () => {
    const { result } = renderHook(() =>
      useAvatarImage({
        seed: 'user@test.com',
        fallbackInitials: 'UT',
      })
    )

    // Trigger first fallback
    act(() => {
      result.current.onError()
    })

    // Trigger second fallback
    act(() => {
      result.current.onError()
    })

    expect(result.current.src).toBe(
      'https://robohash.org/user%40test.com.png?size=128x128&set=set1'
    )
  })

  it('should handle empty seed', () => {
    const { result } = renderHook(() =>
      useAvatarImage({
        seed: '',
        fallbackInitials: 'NA',
      })
    )

    expect(result.current.src).toBe('https://api.dicebear.com/7.x/avataaars/svg?seed=')
  })

  it('should handle empty fallback initials', () => {
    const { result } = renderHook(() =>
      useAvatarImage({
        seed: 'test',
        fallbackInitials: '',
      })
    )

    act(() => {
      result.current.onError()
    })

    expect(result.current.src).toBe(
      'https://ui-avatars.com/api/?name=&background=random&color=fff&size=128'
    )
  })

  it('should maintain consistent behavior across re-renders', () => {
    const { result, rerender } = renderHook(() => useAvatarImage(defaultProps))

    const initialOnError = result.current.onError
    const initialOnLoad = result.current.onLoad

    rerender()

    // Functions should be new instances but behavior should be consistent
    expect(result.current.onError).not.toBe(initialOnError)
    expect(result.current.onLoad).not.toBe(initialOnLoad)
    expect(typeof result.current.onError).toBe('function')
    expect(typeof result.current.onLoad).toBe('function')
  })
})
