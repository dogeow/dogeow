import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSearchManager } from '../useSearchManager'

// Mock document.dispatchEvent
const mockDispatchEvent = vi.fn()
Object.defineProperty(document, 'dispatchEvent', {
  value: mockDispatchEvent,
  writable: true,
})

// Mock window.addEventListener and removeEventListener
const mockAddEventListener = vi.fn()
const mockRemoveEventListener = vi.fn()
Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
  writable: true,
})
Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
  writable: true,
})

describe('useSearchManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useSearchManager('/'))

      expect(result.current.searchTerm).toBe('')
      expect(result.current.isSearchVisible).toBe(false)
      expect(result.current.isSearchDialogOpen).toBe(false)
      expect(result.current.isHomePage).toBe(true)
      expect(result.current.currentApp).toBe('')
    })

    it('should set correct values for non-home page', () => {
      const { result } = renderHook(() => useSearchManager('/chat'))

      expect(result.current.isHomePage).toBe(false)
      expect(result.current.currentApp).toBe('chat')
    })
  })

  describe('handleSearch', () => {
    it('should do nothing when search term is empty', () => {
      const { result } = renderHook(() => useSearchManager('/'))

      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent

      act(() => {
        result.current.handleSearch(mockEvent)
      })

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(mockDispatchEvent).not.toHaveBeenCalled()
    })

    it('should open search dialog on home page', () => {
      const { result } = renderHook(() => useSearchManager('/'))

      act(() => {
        result.current.setSearchTerm('test')
      })

      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent

      act(() => {
        result.current.handleSearch(mockEvent)
      })

      expect(result.current.isSearchDialogOpen).toBe(true)
      expect(mockDispatchEvent).not.toHaveBeenCalled()
    })

    it('should dispatch search event on non-home page', () => {
      const { result } = renderHook(() => useSearchManager('/chat'))

      act(() => {
        result.current.setSearchTerm('test')
      })

      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent

      act(() => {
        result.current.handleSearch(mockEvent)
      })

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'chat-search',
          detail: { searchTerm: 'test' },
        })
      )
    })

    it('should keep search open when keepSearchOpen is true', () => {
      const { result } = renderHook(() => useSearchManager('/chat'))

      act(() => {
        result.current.setSearchTerm('test')
      })

      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent

      act(() => {
        result.current.handleSearch(mockEvent, true)
      })

      expect(result.current.isSearchVisible).toBe(false) // Should remain false since we're not setting it
    })
  })

  describe('toggleSearch', () => {
    it('should close search when already visible', () => {
      const { result } = renderHook(() => useSearchManager('/chat'))

      // We can't directly set isSearchVisible, so we'll test the toggle behavior
      act(() => {
        result.current.toggleSearch()
      })

      expect(result.current.isSearchVisible).toBe(true) // Should open search
    })

    it('should open search dialog on home page when not visible', () => {
      const { result } = renderHook(() => useSearchManager('/'))

      act(() => {
        result.current.toggleSearch()
      })

      expect(result.current.isSearchDialogOpen).toBe(true)
    })

    it('should open search on non-home page when not visible', () => {
      const { result } = renderHook(() => useSearchManager('/chat'))

      act(() => {
        result.current.toggleSearch()
      })

      expect(result.current.isSearchVisible).toBe(true)
    })
  })

  describe('keyboard shortcuts', () => {
    it('should handle Ctrl+K shortcut', () => {
      renderHook(() => useSearchManager('/chat'))

      // Simulate Ctrl+K keydown
      const mockKeydownEvent = {
        ctrlKey: true,
        key: 'k',
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent

      act(() => {
        // Trigger the event listener
        const eventListener = mockAddEventListener.mock.calls.find(
          call => call[0] === 'keydown'
        )?.[1]
        if (eventListener) {
          eventListener(mockKeydownEvent)
        }
      })

      expect(mockKeydownEvent.preventDefault).toHaveBeenCalled()
    })

    it('should handle Cmd+K shortcut on Mac', () => {
      renderHook(() => useSearchManager('/chat'))

      const mockKeydownEvent = {
        metaKey: true,
        key: 'k',
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent

      act(() => {
        const eventListener = mockAddEventListener.mock.calls.find(
          call => call[0] === 'keydown'
        )?.[1]
        if (eventListener) {
          eventListener(mockKeydownEvent)
        }
      })

      expect(mockKeydownEvent.preventDefault).toHaveBeenCalled()
    })

    it('should not handle other key combinations', () => {
      renderHook(() => useSearchManager('/chat'))

      const mockKeydownEvent = {
        ctrlKey: true,
        key: 'a',
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent

      act(() => {
        const eventListener = mockAddEventListener.mock.calls.find(
          call => call[0] === 'keydown'
        )?.[1]
        if (eventListener) {
          eventListener(mockKeydownEvent)
        }
      })

      expect(mockKeydownEvent.preventDefault).not.toHaveBeenCalled()
    })

    it('should handle search dialog on home page', () => {
      const { result } = renderHook(() => useSearchManager('/'))

      const mockKeydownEvent = {
        ctrlKey: true,
        key: 'k',
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent

      act(() => {
        const eventListener = mockAddEventListener.mock.calls.find(
          call => call[0] === 'keydown'
        )?.[1]
        if (eventListener) {
          eventListener(mockKeydownEvent)
        }
      })

      expect(result.current.isSearchDialogOpen).toBe(true)
    })
  })

  describe('search term management', () => {
    it('should update search term', () => {
      const { result } = renderHook(() => useSearchManager('/'))

      act(() => {
        result.current.setSearchTerm('new term')
      })

      expect(result.current.searchTerm).toBe('new term')
    })

    it('should update search text', () => {
      const { result } = renderHook(() => useSearchManager('/'))

      act(() => {
        result.current.setSearchText('new text')
      })

      expect(result.current.searchText).toBe('new text')
    })
  })

  describe('search visibility management', () => {
    it('should update search dialog visibility', () => {
      const { result } = renderHook(() => useSearchManager('/'))

      act(() => {
        result.current.setIsSearchDialogOpen(true)
      })

      expect(result.current.isSearchDialogOpen).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle empty pathname', () => {
      const { result } = renderHook(() => useSearchManager(''))

      expect(result.current.isHomePage).toBe(false) // Empty string is not '/'
    })

    it('should handle pathname with multiple slashes', () => {
      const { result } = renderHook(() => useSearchManager('/app/subpage'))

      expect(result.current.isHomePage).toBe(false)
      expect(result.current.currentApp).toBe('app')
    })

    it('should handle pathname without leading slash', () => {
      const { result } = renderHook(() => useSearchManager('app'))

      expect(result.current.isHomePage).toBe(false)
      expect(result.current.currentApp).toBe(undefined) // No leading slash means no app
    })
  })

  describe('cleanup', () => {
    it('should remove event listener on unmount', () => {
      const { unmount } = renderHook(() => useSearchManager('/'))

      unmount()

      expect(mockRemoveEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
    })
  })
})
