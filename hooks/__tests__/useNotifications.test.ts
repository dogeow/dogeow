import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNotifications } from '../useNotifications'

// Mock dependencies
vi.mock('@/app/chat/chatStore', () => ({
  default: () => ({
    currentRoom: null,
    rooms: [],
    notificationSettings: {
      soundNotifications: true,
      browserNotifications: true,
      roomNotifications: true,
      mentionNotifications: true,
    },
    browserNotificationPermission: 'default',
    requestBrowserNotificationPermission: vi.fn(),
    clearRoomNotifications: vi.fn(),
  }),
}))

vi.mock('@/lib/services/notificationService', () => ({
  default: {
    getInstance: vi.fn(() => ({
      onVisibilityChange: vi.fn(() => vi.fn()),
      notifyNewMessage: vi.fn(),
      notifyMention: vi.fn(),
      notifyUserJoined: vi.fn(),
      notifyUserLeft: vi.fn(),
      playSound: vi.fn(),
      isNotificationSupported: vi.fn(() => true),
      isTabInactive: vi.fn(() => false),
    })),
  },
}))

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useNotifications())

      expect(typeof result.current.notifyNewMessage).toBe('function')
      expect(typeof result.current.notifyMention).toBe('function')
      expect(typeof result.current.notifyUserJoined).toBe('function')
      expect(typeof result.current.notifyUserLeft).toBe('function')
      expect(typeof result.current.playSound).toBe('function')
      expect(typeof result.current.requestPermission).toBe('function')
      expect(typeof result.current.isNotificationSupported).toBe('function')
      expect(typeof result.current.isTabInactive).toBe('function')
    })

    it('should initialize with custom options', () => {
      const { result } = renderHook(() =>
        useNotifications({
          enableSounds: false,
          enableBrowserNotifications: false,
        })
      )

      expect(typeof result.current.notifyNewMessage).toBe('function')
      expect(typeof result.current.notifyMention).toBe('function')
    })
  })

  describe('Notification Methods', () => {
    it('should notify new message when not in current room', () => {
      vi.mocked(require('@/app/chat/chatStore').default).mockReturnValue({
        currentRoom: { id: 2, name: 'Other Room' },
        rooms: [{ id: 1, name: 'Test Room' }],
        notificationSettings: {
          soundNotifications: true,
          browserNotifications: true,
          roomNotifications: true,
          mentionNotifications: true,
        },
        browserNotificationPermission: 'granted',
        requestBrowserNotificationPermission: vi.fn(),
        clearRoomNotifications: vi.fn(),
      })

      const { result } = renderHook(() => useNotifications())

      act(() => {
        result.current.notifyNewMessage(1, 'John', 'Hello world')
      })

      expect(
        require('@/lib/services/notificationService').default.getInstance().notifyNewMessage
      ).toHaveBeenCalledWith('Test Room', 'John', 'Hello world', 1, true)
    })

    it('should not notify when in current room and tab is active', () => {
      vi.mocked(require('@/app/chat/chatStore').default).mockReturnValue({
        currentRoom: { id: 1, name: 'Test Room' },
        rooms: [{ id: 1, name: 'Test Room' }],
        notificationSettings: {
          soundNotifications: true,
          browserNotifications: true,
          roomNotifications: true,
          mentionNotifications: true,
        },
        browserNotificationPermission: 'granted',
        requestBrowserNotificationPermission: vi.fn(),
        clearRoomNotifications: vi.fn(),
      })

      vi.mocked(
        require('@/lib/services/notificationService').default.getInstance().isTabInactive
      ).mockReturnValue(false)

      const { result } = renderHook(() => useNotifications())

      act(() => {
        result.current.notifyNewMessage(1, 'John', 'Hello world')
      })

      expect(
        require('@/lib/services/notificationService').default.getInstance().notifyNewMessage
      ).not.toHaveBeenCalled()
    })

    it('should notify mention with browser notification', () => {
      vi.mocked(require('@/app/chat/chatStore').default).mockReturnValue({
        currentRoom: null,
        rooms: [{ id: 1, name: 'Test Room' }],
        notificationSettings: {
          soundNotifications: true,
          browserNotifications: true,
          roomNotifications: true,
          mentionNotifications: true,
        },
        browserNotificationPermission: 'granted',
        requestBrowserNotificationPermission: vi.fn(),
        clearRoomNotifications: vi.fn(),
      })

      const { result } = renderHook(() => useNotifications())

      act(() => {
        result.current.notifyMention(1, 123, 'John', '@user Hello')
      })

      expect(
        require('@/lib/services/notificationService').default.getInstance().notifyMention
      ).toHaveBeenCalledWith('Test Room', 'John', '@user Hello', 1, 123, true)
    })

    it('should notify user joined in current room', () => {
      vi.mocked(require('@/app/chat/chatStore').default).mockReturnValue({
        currentRoom: { id: 1, name: 'Test Room' },
        rooms: [{ id: 1, name: 'Test Room' }],
        notificationSettings: {
          soundNotifications: true,
          browserNotifications: true,
          roomNotifications: true,
          mentionNotifications: true,
        },
        browserNotificationPermission: 'granted',
        requestBrowserNotificationPermission: vi.fn(),
        clearRoomNotifications: vi.fn(),
      })

      const { result } = renderHook(() => useNotifications())

      act(() => {
        result.current.notifyUserJoined(1, 'John')
      })

      expect(
        require('@/lib/services/notificationService').default.getInstance().notifyUserJoined
      ).toHaveBeenCalledWith('Test Room', 'John', 1, true)
    })

    it('should notify user left in current room', () => {
      vi.mocked(require('@/app/chat/chatStore').default).mockReturnValue({
        currentRoom: { id: 1, name: 'Test Room' },
        rooms: [{ id: 1, name: 'Test Room' }],
        notificationSettings: {
          soundNotifications: true,
          browserNotifications: true,
          roomNotifications: true,
          mentionNotifications: true,
        },
        browserNotificationPermission: 'granted',
        requestBrowserNotificationPermission: vi.fn(),
        clearRoomNotifications: vi.fn(),
      })

      const { result } = renderHook(() => useNotifications())

      act(() => {
        result.current.notifyUserLeft(1, 'John')
      })

      expect(
        require('@/lib/services/notificationService').default.getInstance().notifyUserLeft
      ).toHaveBeenCalledWith('Test Room', 'John', 1, true)
    })
  })

  describe('Sound Notifications', () => {
    it('should play sound when sound notifications enabled', () => {
      vi.mocked(require('@/app/chat/chatStore').default).mockReturnValue({
        currentRoom: null,
        rooms: [],
        notificationSettings: {
          soundNotifications: true,
          browserNotifications: true,
          roomNotifications: true,
          mentionNotifications: true,
        },
        browserNotificationPermission: 'default',
        requestBrowserNotificationPermission: vi.fn(),
        clearRoomNotifications: vi.fn(),
      })

      const { result } = renderHook(() => useNotifications())

      act(() => {
        result.current.playSound('message', 0.5)
      })

      expect(
        require('@/lib/services/notificationService').default.getInstance().playSound
      ).toHaveBeenCalledWith('message', { volume: 0.5 })
    })

    it('should not play sound when sound notifications disabled', () => {
      vi.mocked(require('@/app/chat/chatStore').default).mockReturnValue({
        currentRoom: null,
        rooms: [],
        notificationSettings: {
          soundNotifications: false,
          browserNotifications: true,
          roomNotifications: true,
          mentionNotifications: true,
        },
        browserNotificationPermission: 'default',
        requestBrowserNotificationPermission: vi.fn(),
        clearRoomNotifications: vi.fn(),
      })

      const { result } = renderHook(() => useNotifications())

      act(() => {
        result.current.playSound('message')
      })

      expect(
        require('@/lib/services/notificationService').default.getInstance().playSound
      ).not.toHaveBeenCalled()
    })

    it('should not play sound when enableSounds is false', () => {
      vi.mocked(require('@/app/chat/chatStore').default).mockReturnValue({
        currentRoom: null,
        rooms: [],
        notificationSettings: {
          soundNotifications: true,
          browserNotifications: true,
          roomNotifications: true,
          mentionNotifications: true,
        },
        browserNotificationPermission: 'default',
        requestBrowserNotificationPermission: vi.fn(),
        clearRoomNotifications: vi.fn(),
      })

      const { result } = renderHook(() => useNotifications({ enableSounds: false }))

      act(() => {
        result.current.playSound('message')
      })

      expect(
        require('@/lib/services/notificationService').default.getInstance().playSound
      ).not.toHaveBeenCalled()
    })
  })

  describe('Browser Notifications', () => {
    it('should request browser notification permission when enabled', async () => {
      const mockRequestPermission = vi.fn()
      vi.mocked(require('@/app/chat/chatStore').default).mockReturnValue({
        currentRoom: null,
        rooms: [],
        notificationSettings: {
          soundNotifications: true,
          browserNotifications: true,
          roomNotifications: true,
          mentionNotifications: true,
        },
        browserNotificationPermission: 'default',
        requestBrowserNotificationPermission: mockRequestPermission,
        clearRoomNotifications: vi.fn(),
      })

      const { result } = renderHook(() => useNotifications())

      await act(async () => {
        await result.current.requestPermission()
      })

      expect(mockRequestPermission).toHaveBeenCalled()
    })

    it('should not show browser notifications when permission denied', () => {
      vi.mocked(require('@/app/chat/chatStore').default).mockReturnValue({
        currentRoom: null,
        rooms: [{ id: 1, name: 'Test Room' }],
        notificationSettings: {
          soundNotifications: true,
          browserNotifications: true,
          roomNotifications: true,
          mentionNotifications: true,
        },
        browserNotificationPermission: 'denied',
        requestBrowserNotificationPermission: vi.fn(),
        clearRoomNotifications: vi.fn(),
      })

      const { result } = renderHook(() => useNotifications())

      act(() => {
        result.current.notifyNewMessage(1, 'John', 'Hello world')
      })

      expect(
        require('@/lib/services/notificationService').default.getInstance().notifyNewMessage
      ).not.toHaveBeenCalled()
    })
  })

  describe('Utility Methods', () => {
    it('should check notification support', () => {
      vi.mocked(require('@/app/chat/chatStore').default).mockReturnValue({
        currentRoom: null,
        rooms: [],
        notificationSettings: {
          soundNotifications: true,
          browserNotifications: true,
          roomNotifications: true,
          mentionNotifications: true,
        },
        browserNotificationPermission: 'default',
        requestBrowserNotificationPermission: vi.fn(),
        clearRoomNotifications: vi.fn(),
      })

      const { result } = renderHook(() => useNotifications())

      const isSupported = result.current.isNotificationSupported()
      expect(isSupported).toBe(true)
    })

    it('should check tab inactivity', () => {
      vi.mocked(require('@/app/chat/chatStore').default).mockReturnValue({
        currentRoom: null,
        rooms: [],
        notificationSettings: {
          soundNotifications: true,
          browserNotifications: true,
          roomNotifications: true,
          mentionNotifications: true,
        },
        browserNotificationPermission: 'default',
        requestBrowserNotificationPermission: vi.fn(),
        clearRoomNotifications: vi.fn(),
      })

      const { result } = renderHook(() => useNotifications())

      const isInactive = result.current.isTabInactive()
      expect(isInactive).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle room not found', () => {
      vi.mocked(require('@/app/chat/chatStore').default).mockReturnValue({
        currentRoom: null,
        rooms: [],
        notificationSettings: {
          soundNotifications: true,
          browserNotifications: true,
          roomNotifications: true,
          mentionNotifications: true,
        },
        browserNotificationPermission: 'granted',
        requestBrowserNotificationPermission: vi.fn(),
        clearRoomNotifications: vi.fn(),
      })

      const { result } = renderHook(() => useNotifications())

      act(() => {
        result.current.notifyNewMessage(999, 'John', 'Hello world')
      })

      expect(
        require('@/lib/services/notificationService').default.getInstance().notifyNewMessage
      ).not.toHaveBeenCalled()
    })

    it('should handle empty rooms array', () => {
      vi.mocked(require('@/app/chat/chatStore').default).mockReturnValue({
        currentRoom: null,
        rooms: [],
        notificationSettings: {
          soundNotifications: true,
          browserNotifications: true,
          roomNotifications: true,
          mentionNotifications: true,
        },
        browserNotificationPermission: 'granted',
        requestBrowserNotificationPermission: vi.fn(),
        clearRoomNotifications: vi.fn(),
      })

      const { result } = renderHook(() => useNotifications())

      act(() => {
        result.current.notifyNewMessage(1, 'John', 'Hello world')
      })

      expect(
        require('@/lib/services/notificationService').default.getInstance().notifyNewMessage
      ).not.toHaveBeenCalled()
    })

    it('should handle null current room', () => {
      vi.mocked(require('@/app/chat/chatStore').default).mockReturnValue({
        currentRoom: null,
        rooms: [{ id: 1, name: 'Test Room' }],
        notificationSettings: {
          soundNotifications: true,
          browserNotifications: true,
          roomNotifications: true,
          mentionNotifications: true,
        },
        browserNotificationPermission: 'granted',
        requestBrowserNotificationPermission: vi.fn(),
        clearRoomNotifications: vi.fn(),
      })

      const { result } = renderHook(() => useNotifications())

      act(() => {
        result.current.notifyUserJoined(1, 'John')
      })

      expect(
        require('@/lib/services/notificationService').default.getInstance().notifyUserJoined
      ).not.toHaveBeenCalled()
    })
  })
})
