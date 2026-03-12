import { renderHook } from '@testing-library/react'
import { vi } from 'vitest'
import { resolveBackgroundImageUrl, useBackgroundManager } from '../useBackgroundManager'

// Mock functions
const mockSetBackgroundImage = vi.fn()
const mockBackgroundStore = {
  backgroundImage: '',
  setBackgroundImage: mockSetBackgroundImage,
}

vi.mock('@/stores/backgroundStore', () => ({
  useBackgroundStore: () => mockBackgroundStore,
}))

describe('useBackgroundManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset document.body.style
    document.body.style.backgroundImage = ''
    document.body.style.backgroundSize = ''
    document.body.style.backgroundPosition = ''
    document.body.style.backgroundRepeat = ''
    document.body.style.backgroundAttachment = ''
    mockBackgroundStore.backgroundImage = ''
  })

  it('should return background image and setter function', () => {
    const { result } = renderHook(() => useBackgroundManager())

    expect(result.current.backgroundImage).toBe('')
    expect(result.current.setBackgroundImage).toBe(mockSetBackgroundImage)
  })

  it('should clear background when backgroundImage is empty', () => {
    mockBackgroundStore.backgroundImage = ''
    renderHook(() => useBackgroundManager())

    expect(document.body.style.backgroundImage).toBe('')
    expect(document.body.style.backgroundSize).toBe('')
  })

  it('should clear background when backgroundImage is null', () => {
    mockBackgroundStore.backgroundImage = null as unknown as string
    renderHook(() => useBackgroundManager())

    expect(document.body.style.backgroundImage).toBe('')
  })

  it('should set system background image for configured filename', () => {
    mockBackgroundStore.backgroundImage = '君の名は.webp'
    renderHook(() => useBackgroundManager())

    expect(document.body.style.backgroundImage).toBe('url("/images/backgrounds/君の名は.webp")')
    expect(document.body.style.backgroundSize).toBe('cover')
    expect(document.body.style.backgroundPosition).toBe('center center')
    expect(document.body.style.backgroundRepeat).toBe('no-repeat')
    expect(document.body.style.backgroundAttachment).toBe('fixed')
  })

  it('should set system background image for another configured filename', () => {
    mockBackgroundStore.backgroundImage = '钢铁侠.jpg'
    renderHook(() => useBackgroundManager())

    expect(document.body.style.backgroundImage).toBe('url("/images/backgrounds/钢铁侠.jpg")')
  })

  it('should set custom base64 background image', () => {
    const base64Image = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//2Q=='
    mockBackgroundStore.backgroundImage = base64Image
    renderHook(() => useBackgroundManager())

    expect(document.body.style.backgroundImage).toBe(`url("${base64Image}")`)
    expect(document.body.style.backgroundSize).toBe('cover')
    expect(document.body.style.backgroundPosition).toBe('center center')
    expect(document.body.style.backgroundRepeat).toBe('no-repeat')
    expect(document.body.style.backgroundAttachment).toBe('fixed')
  })

  it('should set background for arbitrary local filenames', () => {
    mockBackgroundStore.backgroundImage = 'unknown-image.jpg'
    renderHook(() => useBackgroundManager())

    expect(document.body.style.backgroundImage).toBe('url("/images/backgrounds/unknown-image.jpg")')
  })

  it('should update background when backgroundImage changes', () => {
    const { rerender } = renderHook(() => useBackgroundManager())

    // Initially no background
    expect(document.body.style.backgroundImage).toBe('')

    // Set system background
    mockBackgroundStore.backgroundImage = '守望先锋.png'
    rerender()

    expect(document.body.style.backgroundImage).toBe('url("/images/backgrounds/守望先锋.png")')

    // Change to base64 background
    const base64Image =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    mockBackgroundStore.backgroundImage = base64Image
    rerender()

    expect(document.body.style.backgroundImage).toBe(`url("${base64Image}")`)

    // Clear background
    mockBackgroundStore.backgroundImage = ''
    rerender()

    expect(document.body.style.backgroundImage).toBe('')
  })

  it('should handle local image filenames with different extensions', () => {
    const testCases = ['bg-123.jpg', 'bg-456.png', 'bg-789.webp']

    testCases.forEach(imageName => {
      mockBackgroundStore.backgroundImage = imageName
      const { rerender } = renderHook(() => useBackgroundManager())
      rerender()

      expect(document.body.style.backgroundImage).toBe(`url("/images/backgrounds/${imageName}")`)
    })
  })

  it('should handle external and blob image urls', () => {
    const testCases = [
      'https://example.com/background.jpg',
      'blob:https://example.com/12345678-1234-1234-1234-123456789012',
      '//cdn.example.com/background.webp',
    ]

    testCases.forEach(imageUrl => {
      mockBackgroundStore.backgroundImage = imageUrl
      const { rerender } = renderHook(() => useBackgroundManager())
      rerender()

      expect(document.body.style.backgroundImage).toBe(`url("${imageUrl}")`)
    })
  })

  it('should handle different base64 image formats', () => {
    const testCases = [
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//2Q==',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
    ]

    testCases.forEach(base64Image => {
      mockBackgroundStore.backgroundImage = base64Image
      const { rerender } = renderHook(() => useBackgroundManager())
      rerender()

      expect(document.body.style.backgroundImage).toBe(`url("${base64Image}")`)
    })
  })

  it('should apply all CSS properties correctly', () => {
    mockBackgroundStore.backgroundImage = 'wallhaven-test.jpg'
    renderHook(() => useBackgroundManager())

    const bodyStyle = document.body.style
    expect(bodyStyle.backgroundImage).toBe('url("/images/backgrounds/wallhaven-test.jpg")')
    expect(bodyStyle.backgroundSize).toBe('cover')
    expect(bodyStyle.backgroundPosition).toBe('center center')
    expect(bodyStyle.backgroundRepeat).toBe('no-repeat')
    expect(bodyStyle.backgroundAttachment).toBe('fixed')
  })

  it('should handle edge case with empty string after data:', () => {
    mockBackgroundStore.backgroundImage = 'data:'
    renderHook(() => useBackgroundManager())

    expect(document.body.style.backgroundImage).toBe('url("data:")')
  })

  it('should handle absolute local paths', () => {
    mockBackgroundStore.backgroundImage = '/images/backgrounds/custom.jpg'
    renderHook(() => useBackgroundManager())

    expect(document.body.style.backgroundImage).toBe('url("/images/backgrounds/custom.jpg")')
  })

  it('should handle cleanup on unmount', () => {
    mockBackgroundStore.backgroundImage = 'wallhaven-test.jpg'
    const { unmount } = renderHook(() => useBackgroundManager())

    expect(document.body.style.backgroundImage).toBe(
      'url("/images/backgrounds/wallhaven-test.jpg")'
    )

    unmount()

    // Background should still be set after unmount (no cleanup in this hook)
    expect(document.body.style.backgroundImage).toBe(
      'url("/images/backgrounds/wallhaven-test.jpg")'
    )
  })

  it('should resolve background image urls consistently', () => {
    expect(resolveBackgroundImageUrl('君の名は.webp')).toBe('/images/backgrounds/君の名は.webp')
    expect(resolveBackgroundImageUrl('https://example.com/bg.jpg')).toBe(
      'https://example.com/bg.jpg'
    )
    expect(resolveBackgroundImageUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc')
    expect(resolveBackgroundImageUrl('/images/backgrounds/bg.jpg')).toBe(
      '/images/backgrounds/bg.jpg'
    )
    expect(resolveBackgroundImageUrl('')).toBe('')
  })
})
