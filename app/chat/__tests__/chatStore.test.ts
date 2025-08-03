import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from '@testing-library/react'
import { useChatStore } from '../chatStore'
import type { ChatRoom, ChatMessage, OnlineUser } from '../types'

// Mock dependencies
vi.mock('@/lib/api', () => ({
  get: vi.fn(),
  post: vi.fn(),
}))

vi.mock('@/lib/api/chat-error-handler', () => ({
  handleChatApiError: vi.fn(),
}))

vi.mock('@/lib/cache/chat-cache', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn(),
    addMessageToCache: vi.fn(),
  },
}))

describe('ChatStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    act(() => {
      useChatStore.getState().reset()
    })
    vi.clearAllMocks()
  })

  describe('Core State Management', () => {
    it('should initialize with correct default state', () => {
      const state = useChatStore.getState()

      expect(state.currentRoom).toBeNull()
      expect(state.rooms).toEqual([])
      expect(state.messages).toEqual({})
      expect(state.onlineUsers).toEqual({})
      expect(state.isLoading).toBe(false)
      expect(state.isConnected).toBe(false)
      expect(state.connectionStatus).toBe('disconnected')
      expect(state.error).toBeNull()
      expect(state.totalUnreadCount).toBe(0)
    })

    it('should set current room correctly', () => {
      const mockRoom: ChatRoom = {
        id: 1,
        name: 'Test Room',
        description: 'Test Description',
        created_by: 1,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        online_count: 5,
        message_count: 10,
        last_activity: '2024-01-01T00:00:00Z',
        unread_count: 0,
      }

      act(() => {
        useChatStore.getState().setCurrentRoom(mockRoom)
      })

      expect(useChatStore.getState().currentRoom).toEqual(mockRoom)
    })

    it('should set rooms correctly', () => {
      const mockRooms: ChatRoom[] = [
        {
          id: 1,
          name: 'Room 1',
          description: 'Description 1',
          created_by: 1,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          online_count: 3,
          message_count: 5,
          last_activity: '2024-01-01T00:00:00Z',
          unread_count: 0,
        },
        {
          id: 2,
          name: 'Room 2',
          description: 'Description 2',
          created_by: 2,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          online_count: 2,
          message_count: 3,
          last_activity: '2024-01-01T00:00:00Z',
          unread_count: 0,
        },
      ]

      act(() => {
        useChatStore.getState().setRooms(mockRooms)
      })

      expect(useChatStore.getState().rooms).toEqual(mockRooms)
    })
  })

  describe('Message Operations', () => {
    it('should add message to room correctly', () => {
      const mockMessage: ChatMessage = {
        id: 1,
        room_id: 1,
        user_id: 1,
        message: 'Test message',
        message_type: 'text',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
        },
      }

      act(() => {
        useChatStore.getState().addMessage(1, mockMessage)
      })

      const state = useChatStore.getState()
      expect(state.messages['1']).toEqual([mockMessage])
    })

    it('should clear messages for room correctly', () => {
      const mockMessage: ChatMessage = {
        id: 1,
        room_id: 1,
        user_id: 1,
        message: 'Test message',
        message_type: 'text',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
        },
      }

      // Add message first
      act(() => {
        useChatStore.getState().addMessage(1, mockMessage)
      })

      // Clear messages
      act(() => {
        useChatStore.getState().clearMessages(1)
      })

      const state = useChatStore.getState()
      expect(state.messages['1']).toEqual([])
    })
  })

  describe('Online Users Operations', () => {
    it('should update online users correctly', () => {
      const mockUsers: OnlineUser[] = [
        {
          id: 1,
          name: 'User 1',
          email: 'user1@example.com',
          joined_at: '2024-01-01T00:00:00Z',
          is_online: true,
        },
        {
          id: 2,
          name: 'User 2',
          email: 'user2@example.com',
          joined_at: '2024-01-01T00:00:00Z',
          is_online: true,
        },
      ]

      act(() => {
        useChatStore.getState().updateOnlineUsers(1, mockUsers)
      })

      const state = useChatStore.getState()
      expect(state.onlineUsers['1']).toEqual(mockUsers)
    })

    it('should add online user correctly', () => {
      const mockUser: OnlineUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        joined_at: '2024-01-01T00:00:00Z',
        is_online: true,
      }

      act(() => {
        useChatStore.getState().addOnlineUser(1, mockUser)
      })

      const state = useChatStore.getState()
      expect(state.onlineUsers['1']).toEqual([mockUser])
    })

    it('should remove online user correctly', () => {
      const mockUsers: OnlineUser[] = [
        {
          id: 1,
          name: 'User 1',
          email: 'user1@example.com',
          joined_at: '2024-01-01T00:00:00Z',
          is_online: true,
        },
        {
          id: 2,
          name: 'User 2',
          email: 'user2@example.com',
          joined_at: '2024-01-01T00:00:00Z',
          is_online: true,
        },
      ]

      // Add users first
      act(() => {
        useChatStore.getState().updateOnlineUsers(1, mockUsers)
      })

      // Remove user
      act(() => {
        useChatStore.getState().removeOnlineUser(1, 1)
      })

      const state = useChatStore.getState()
      expect(state.onlineUsers['1']).toHaveLength(1)
      expect(state.onlineUsers['1'][0].id).toBe(2)
    })
  })

  describe('Connection Management', () => {
    it('should set connection status correctly', () => {
      act(() => {
        useChatStore.getState().setConnectionStatus('connected')
      })

      expect(useChatStore.getState().connectionStatus).toBe('connected')
    })

    it('should set connected state correctly', () => {
      act(() => {
        useChatStore.getState().setConnected(true)
      })

      expect(useChatStore.getState().isConnected).toBe(true)
    })
  })

  describe('Notification Operations', () => {
    it('should increment unread count correctly', () => {
      act(() => {
        useChatStore.getState().incrementUnreadCount(1)
      })

      const state = useChatStore.getState()
      expect(state.notifications['1']?.unreadCount).toBe(1)
      expect(state.totalUnreadCount).toBe(1)
    })

    it('should clear room notifications correctly', () => {
      // Add notification first
      act(() => {
        useChatStore.getState().incrementUnreadCount(1)
      })

      // Clear notifications
      act(() => {
        useChatStore.getState().clearRoomNotifications(1)
      })

      const state = useChatStore.getState()
      expect(state.notifications['1']?.unreadCount).toBe(0)
      expect(state.totalUnreadCount).toBe(0)
    })

    it('should get room unread count correctly', () => {
      act(() => {
        useChatStore.getState().incrementUnreadCount(1)
        useChatStore.getState().incrementUnreadCount(1)
      })

      const unreadCount = useChatStore.getState().getRoomUnreadCount(1)
      expect(unreadCount).toBe(2)
    })

    it('should get total unread count correctly', () => {
      act(() => {
        useChatStore.getState().incrementUnreadCount(1)
        useChatStore.getState().incrementUnreadCount(2)
      })

      const totalUnreadCount = useChatStore.getState().getTotalUnreadCount()
      expect(totalUnreadCount).toBe(2)
    })
  })

  describe('Error Handling', () => {
    it('should set error correctly', () => {
      const mockError = {
        type: 'network' as const,
        message: 'Network error',
        code: 500,
        timestamp: new Date(),
        retryable: true,
        userFriendly: true,
      }

      act(() => {
        useChatStore.getState().setError(mockError)
      })

      expect(useChatStore.getState().error).toEqual(mockError)
      expect(useChatStore.getState().lastError).toEqual(mockError)
    })

    it('should clear error correctly', () => {
      const mockError = {
        type: 'network' as const,
        message: 'Network error',
        code: 500,
        timestamp: new Date(),
        retryable: true,
        userFriendly: true,
      }

      // Set error first
      act(() => {
        useChatStore.getState().setError(mockError)
      })

      // Clear error
      act(() => {
        useChatStore.getState().clearError()
      })

      expect(useChatStore.getState().error).toBeNull()
    })
  })

  describe('Utility Actions', () => {
    it('should set loading state correctly', () => {
      act(() => {
        useChatStore.getState().setLoading(true)
      })

      expect(useChatStore.getState().isLoading).toBe(true)
    })

    it('should reset store to initial state', () => {
      // Modify state first
      act(() => {
        useChatStore.getState().setLoading(true)
        useChatStore.getState().setCurrentRoom({} as ChatRoom)
      })

      // Reset
      act(() => {
        useChatStore.getState().reset()
      })

      const state = useChatStore.getState()
      expect(state.isLoading).toBe(false)
      expect(state.currentRoom).toBeNull()
      expect(state.rooms).toEqual([])
      expect(state.messages).toEqual({})
    })
  })
})
