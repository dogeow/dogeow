import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useChatRoom } from '../useChatRoom'

// Mock dependencies
vi.mock('@/hooks/useChatWebSocket', () => ({
  useChatWebSocket: vi.fn(() => ({
    connect: vi.fn(() => Promise.resolve(true)),
    disconnect: vi.fn(),
    sendMessage: vi.fn(() => Promise.resolve({ success: true })),
    isConnected: false,
  })),
}))

vi.mock('@/lib/websocket', () => ({
  getAuthManager: vi.fn(() => ({
    getToken: vi.fn(() => 'mock-token'),
  })),
}))

// Mock fetch
global.fetch = vi.fn()

describe('useChatRoom', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ rooms: [], users: [] }),
    } as Response)
  })

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useChatRoom())

      expect(result.current.currentRoom).toBeNull()
      expect(result.current.rooms).toEqual([])
      expect(result.current.messages).toEqual([])
      expect(result.current.onlineUsers).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isConnected).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should initialize with options', () => {
      const { result } = renderHook(() =>
        useChatRoom({
          autoLoadRooms: false,
          messagesPerPage: 25,
        })
      )

      expect(result.current.currentRoom).toBeNull()
      expect(result.current.rooms).toEqual([])
    })
  })

  describe('Room Management', () => {
    it('should join room successfully', async () => {
      const { result } = renderHook(() => useChatRoom())

      await act(async () => {
        const success = await result.current.joinRoom('1')
        expect(success).toBe(true)
      })
    })

    it('should leave room successfully', async () => {
      const { result } = renderHook(() => useChatRoom())

      await act(async () => {
        result.current.leaveRoom()
      })

      expect(result.current.currentRoom).toBeNull()
    })

    it('should create room successfully', async () => {
      const { result } = renderHook(() => useChatRoom())

      const roomData = {
        name: 'Test Room',
        description: 'Test Description',
        is_private: false,
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            room: {
              id: 1,
              name: 'Test Room',
              description: 'Test Description',
              is_private: false,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              user_count: 0,
              last_message_at: null,
            },
          }),
      } as Response)

      await act(async () => {
        const newRoom = await result.current.createRoom(roomData)
        expect(newRoom?.name).toBe('Test Room')
      })
    })

    it('should load rooms successfully', async () => {
      const { result } = renderHook(() => useChatRoom())

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ rooms: [] }),
      } as Response)

      await act(async () => {
        await result.current.loadRooms()
      })

      expect(result.current.rooms).toHaveLength(0)
    })
  })

  describe('Message Management', () => {
    it('should send message successfully', async () => {
      const { result } = renderHook(() => useChatRoom())

      await act(async () => {
        const res = await result.current.sendMessage('1', 'Hello World')
        expect(res.success).toBe(true)
      })
    })

    it('should load more messages successfully', async () => {
      const { result } = renderHook(() => useChatRoom())

      await act(async () => {
        await result.current.loadMoreMessages()
      })

      // Should not throw error
      expect(true).toBe(true)
    })
  })

  describe('Online Users Management', () => {
    it('should load online users successfully', async () => {
      const { result } = renderHook(() => useChatRoom())

      await act(async () => {
        await result.current.loadOnlineUsers()
      })

      expect(result.current.onlineUsers).toEqual([])
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const { result } = renderHook(() => useChatRoom())

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ message: 'API Error' }),
      } as Response)

      await act(async () => {
        await result.current.loadRooms()
      })

      expect(result.current.error).toBeTruthy()
    })

    it('should handle network errors', async () => {
      const { result } = renderHook(() => useChatRoom())

      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await act(async () => {
        await result.current.loadRooms()
      })

      expect(result.current.error).toBeTruthy()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty message', async () => {
      const { result } = renderHook(() => useChatRoom())

      await act(async () => {
        const res = await result.current.sendMessage('1', '')
        expect(res.success).toBe(false)
      })
    })

    it('should handle very long message', async () => {
      const { result } = renderHook(() => useChatRoom())

      const longMessage = 'a'.repeat(1001)

      await act(async () => {
        const res = await result.current.sendMessage('1', longMessage)
        expect(res.success).toBe(true)
      })
    })

    it('should handle missing auth token', async () => {
      const { result } = renderHook(() => useChatRoom())

      // Mock missing token
      vi.mocked(fetch).mockRejectedValueOnce(new Error('No authentication token available'))

      await act(async () => {
        await result.current.loadRooms()
      })

      expect(result.current.error).toBeTruthy()
    })
  })

  describe('State Management', () => {
    it('should track loading states correctly', async () => {
      const { result } = renderHook(() => useChatRoom())

      expect(result.current.isLoading).toBe(false)
      expect(result.current.isLoadingMessages).toBe(false)
      expect(result.current.isLoadingMoreMessages).toBe(false)
    })

    it('should track message pagination', () => {
      const { result } = renderHook(() => useChatRoom())

      expect(result.current.hasMoreMessages).toBe(true)
    })
  })
})
