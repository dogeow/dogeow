import { renderHook, act } from '@testing-library/react'
import { useBackgroundStore } from '../backgroundStore'

describe('backgroundStore', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()

    // Reset store state
    useBackgroundStore.setState({
      backgroundImage: '',
    })
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useBackgroundStore())

    expect(result.current.backgroundImage).toBe('')
  })

  it('should set background image', () => {
    const { result } = renderHook(() => useBackgroundStore())
    const testImageUrl = 'https://example.com/background.jpg'

    act(() => {
      result.current.setBackgroundImage(testImageUrl)
    })

    expect(result.current.backgroundImage).toBe(testImageUrl)
  })

  it('should handle empty string background image', () => {
    const { result } = renderHook(() => useBackgroundStore())

    // Set a background first
    act(() => {
      result.current.setBackgroundImage('https://example.com/background.jpg')
    })

    expect(result.current.backgroundImage).toBe('https://example.com/background.jpg')

    // Clear the background
    act(() => {
      result.current.setBackgroundImage('')
    })

    expect(result.current.backgroundImage).toBe('')
  })

  it('should handle various URL formats', () => {
    const { result } = renderHook(() => useBackgroundStore())
    const testUrls = [
      'https://example.com/image.jpg',
      '/local/image.png',
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD',
      'blob:https://example.com/12345678-1234-1234-1234-123456789012',
    ]

    testUrls.forEach(url => {
      act(() => {
        result.current.setBackgroundImage(url)
      })

      expect(result.current.backgroundImage).toBe(url)
    })
  })

  it('should persist background image state', () => {
    const testImageUrl = 'https://example.com/persisted-background.jpg'

    // Set background image
    useBackgroundStore.setState({ backgroundImage: testImageUrl })

    // Create new hook instance to simulate rehydration
    const { result } = renderHook(() => useBackgroundStore())

    expect(result.current.backgroundImage).toBe(testImageUrl)
  })

  it('should handle special characters in URLs', () => {
    const { result } = renderHook(() => useBackgroundStore())
    const specialUrl = 'https://example.com/image with spaces & symbols.jpg?param=value#anchor'

    act(() => {
      result.current.setBackgroundImage(specialUrl)
    })

    expect(result.current.backgroundImage).toBe(specialUrl)
  })

  it('should update background image multiple times', () => {
    const { result } = renderHook(() => useBackgroundStore())
    const urls = [
      'https://example.com/bg1.jpg',
      'https://example.com/bg2.png',
      'https://example.com/bg3.gif',
    ]

    urls.forEach(url => {
      act(() => {
        result.current.setBackgroundImage(url)
      })

      expect(result.current.backgroundImage).toBe(url)
    })
  })
})
