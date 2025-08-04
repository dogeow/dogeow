import { renderHook } from '@testing-library/react'
import { vi } from 'vitest'
import { useBackgroundManager } from '../useBackgroundManager'

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
  })

  it('should clear background when backgroundImage is null', () => {
    mockBackgroundStore.backgroundImage = null as unknown as string
    renderHook(() => useBackgroundManager())

    expect(document.body.style.backgroundImage).toBe('')
  })

  it('should set system background image with wallhaven prefix', () => {
    mockBackgroundStore.backgroundImage = 'wallhaven-123456.jpg'
    renderHook(() => useBackgroundManager())

    expect(document.body.style.backgroundImage).toBe(
      'url("/images/backgrounds/wallhaven-123456.jpg")'
    )
    expect(document.body.style.backgroundSize).toBe('cover')
    expect(document.body.style.backgroundPosition).toBe('center')
    expect(document.body.style.backgroundRepeat).toBe('no-repeat')
    expect(document.body.style.backgroundAttachment).toBe('fixed')
  })

  it('should set system background image with F_RIhiObMAA prefix', () => {
    mockBackgroundStore.backgroundImage = 'F_RIhiObMAA_test.jpg'
    renderHook(() => useBackgroundManager())

    expect(document.body.style.backgroundImage).toBe(
      'url("/images/backgrounds/F_RIhiObMAA_test.jpg")'
    )
    expect(document.body.style.backgroundSize).toBe('cover')
    expect(document.body.style.backgroundPosition).toBe('center')
    expect(document.body.style.backgroundRepeat).toBe('no-repeat')
    expect(document.body.style.backgroundAttachment).toBe('fixed')
  })

  it('should set custom base64 background image', () => {
    const base64Image = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//2Q=='
    mockBackgroundStore.backgroundImage = base64Image
    renderHook(() => useBackgroundManager())

    expect(document.body.style.backgroundImage).toBe(`url("${base64Image}")`)
    expect(document.body.style.backgroundSize).toBe('cover')
    expect(document.body.style.backgroundPosition).toBe('center')
    expect(document.body.style.backgroundRepeat).toBe('no-repeat')
    expect(document.body.style.backgroundAttachment).toBe('fixed')
  })

  it('should not set background for unknown image types', () => {
    mockBackgroundStore.backgroundImage = 'unknown-image.jpg'
    renderHook(() => useBackgroundManager())

    expect(document.body.style.backgroundImage).toBe('')
  })

  it('should update background when backgroundImage changes', () => {
    const { rerender } = renderHook(() => useBackgroundManager())

    // Initially no background
    expect(document.body.style.backgroundImage).toBe('')

    // Set wallhaven background
    mockBackgroundStore.backgroundImage = 'wallhaven-test.jpg'
    rerender()

    expect(document.body.style.backgroundImage).toBe(
      'url("/images/backgrounds/wallhaven-test.jpg")'
    )

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

  it('should handle wallhaven images with different extensions', () => {
    const testCases = ['wallhaven-123.jpg', 'wallhaven-456.png', 'wallhaven-789.webp']

    testCases.forEach(imageName => {
      mockBackgroundStore.backgroundImage = imageName
      const { rerender } = renderHook(() => useBackgroundManager())
      rerender()

      expect(document.body.style.backgroundImage).toBe(`url("/images/backgrounds/${imageName}")`)
    })
  })

  it('should handle F_RIhiObMAA images with different suffixes', () => {
    const testCases = ['F_RIhiObMAA_1.jpg', 'F_RIhiObMAA_sunset.png', 'F_RIhiObMAA_nature.webp']

    testCases.forEach(imageName => {
      mockBackgroundStore.backgroundImage = imageName
      const { rerender } = renderHook(() => useBackgroundManager())
      rerender()

      expect(document.body.style.backgroundImage).toBe(`url("/images/backgrounds/${imageName}")`)
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
    expect(bodyStyle.backgroundPosition).toBe('center')
    expect(bodyStyle.backgroundRepeat).toBe('no-repeat')
    expect(bodyStyle.backgroundAttachment).toBe('fixed')
  })

  it('should handle edge case with empty string after data:', () => {
    mockBackgroundStore.backgroundImage = 'data:'
    renderHook(() => useBackgroundManager())

    expect(document.body.style.backgroundImage).toBe('url("data:")')
  })

  it('should handle partial wallhaven match', () => {
    // Should not match if wallhaven is not at the start
    mockBackgroundStore.backgroundImage = 'not-wallhaven-test.jpg'
    renderHook(() => useBackgroundManager())

    expect(document.body.style.backgroundImage).toBe('')
  })

  it('should handle partial F_RIhiObMAA match', () => {
    // Should not match if F_RIhiObMAA is not at the start
    mockBackgroundStore.backgroundImage = 'not-F_RIhiObMAA_test.jpg'
    renderHook(() => useBackgroundManager())

    expect(document.body.style.backgroundImage).toBe('')
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
})
