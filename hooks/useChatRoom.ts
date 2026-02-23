import { useState, useEffect, useCallback, useRef } from 'react'
import { usePagination } from '@/hooks/usePagination'
import { useChatWebSocket } from './useChatWebSocket'
import type { SendMessageResult } from './chat-websocket/types'
import { getAuthManager } from '@/lib/websocket'
import type {
  ChatRoom,
  ChatMessage,
  OnlineUser,
  CreateRoomData,
  MessagePagination,
} from '@/app/chat/types'

export interface UseChatRoomReturn {
  // Room management
  rooms: ChatRoom[]
  currentRoom: ChatRoom | null
  joinRoom: (roomId: string) => Promise<boolean>
  leaveRoom: () => void
  createRoom: (roomData: CreateRoomData) => Promise<ChatRoom | null>
  loadRooms: () => Promise<void>

  // Messages
  messages: ChatMessage[]
  sendMessage: (roomId: string, message: string) => Promise<SendMessageResult>
  loadMoreMessages: () => Promise<void>
  hasMoreMessages: boolean

  // Users
  onlineUsers: OnlineUser[]
  loadOnlineUsers: () => Promise<void>

  // State
  isLoading: boolean
  isLoadingMessages: boolean
  isLoadingMoreMessages: boolean
  error: string | null
  isConnected: boolean
}

export interface UseChatRoomOptions {
  autoLoadRooms?: boolean
  messagesPerPage?: number
  onNewMessage?: (message: ChatMessage) => void
  onUserJoined?: (user: OnlineUser) => void
  onUserLeft?: (user: OnlineUser) => void
  onError?: (error: string) => void
}

export const useChatRoom = (options: UseChatRoomOptions = {}): UseChatRoomReturn => {
  const {
    autoLoadRooms = true,
    messagesPerPage = 50,
    onNewMessage,
    onUserJoined,
    onUserLeft,
    onError,
  } = options

  // State
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)

  // pagination helper for message pages
  const { currentPage, setPage: setCurrentPage, reset: resetPage, goNext } = usePagination(1)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isInitialLoad = useRef(true)

  // WebSocket connection
  const {
    connect,
    disconnect,
    sendMessage: wsSendMessage,
    isConnected,
  } = useChatWebSocket({
    onMessage: handleWebSocketMessage,
    onError: wsError => {
      setError(`WebSocket error: ${wsError.message}`)
      if (onError) onError(`WebSocket error: ${wsError.message}`)
    },
    authTokenRefreshCallback: async () => {
      // This should be implemented based on your auth system
      const authManager = getAuthManager()
      return authManager.getToken()
    },
  })

  // Handle WebSocket messages
  function handleWebSocketMessage(data: unknown) {
    const typedData = data as {
      type?: string
      user?: OnlineUser
      message?: ChatMessage
    }

    if (typedData.type === 'user_joined') {
      const user = typedData.user
      if (user) {
        setOnlineUsers(prev => {
          const exists = prev.find(u => u.id === user.id)
          if (!exists) {
            const updated = [...prev, user]
            if (onUserJoined) onUserJoined(user)
            return updated
          }
          return prev
        })
      }
    } else if (typedData.type === 'user_left') {
      const user = typedData.user
      if (user) {
        setOnlineUsers(prev => {
          const updated = prev.filter(u => u.id !== user.id)
          if (onUserLeft) onUserLeft(user)
          return updated
        })
      }
    } else if (typedData.message) {
      // New message received
      const message = typedData.message
      setMessages(prev => {
        const exists = prev.find(m => m.id === message.id)
        if (!exists) {
          const updated = [...prev, message]
          if (onNewMessage) onNewMessage(message)

          // Auto-scroll to bottom for new messages
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          }, 100)

          return updated
        }
        return prev
      })
    }
  }

  // API helper function
  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const authManager = getAuthManager()
    const token = authManager.getToken()

    if (!token) {
      throw new Error('No authentication token available')
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }, [])

  // Load available rooms
  const loadRooms = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await apiCall('/chat/rooms')
      setRooms(data.rooms || data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load rooms'
      setError(errorMessage)
      if (onError) onError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [apiCall, onError])

  // Create a new room
  const createRoom = useCallback(
    async (roomData: CreateRoomData): Promise<ChatRoom | null> => {
      try {
        setIsLoading(true)
        setError(null)

        const data = await apiCall('/chat/rooms', {
          method: 'POST',
          body: JSON.stringify(roomData),
        })

        const newRoom: ChatRoom = data.room || data
        setRooms(prev => [...prev, newRoom])

        return newRoom
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create room'
        setError(errorMessage)
        if (onError) onError(errorMessage)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [apiCall, onError]
  )

  // Leave current room
  const leaveRoom = useCallback(async () => {
    if (!currentRoom) return

    try {
      await apiCall(`/chat/rooms/${currentRoom.id}/leave`, { method: 'POST' })
    } catch (err) {
      console.error('Error leaving room:', err)
    }

    setCurrentRoom(null)
    setMessages([])
    setOnlineUsers([])
    disconnect()
  }, [currentRoom, apiCall, disconnect])

  // Load messages for current room
  const loadMessages = useCallback(
    async (roomId: string, page: number = 1) => {
      if (!roomId) return

      try {
        if (page === 1) {
          setIsLoadingMessages(true)
        } else {
          setIsLoadingMoreMessages(true)
        }
        setError(null)

        const data: MessagePagination = await apiCall(
          `/chat/rooms/${roomId}/messages?page=${page}&per_page=${messagesPerPage}`
        )

        if (page === 1) {
          // Initial load - replace messages
          setMessages(data.data.reverse()) // Reverse to show oldest first
          if (isInitialLoad.current) {
            // Scroll to bottom on initial load
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
            }, 100)
            isInitialLoad.current = false
          }
        } else {
          // Load more - prepend older messages
          setMessages(prev => [...data.data.reverse(), ...prev])
        }

        setHasMoreMessages(data.current_page < data.last_page)
        setCurrentPage(data.current_page)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load messages'
        setError(errorMessage)
        if (onError) onError(errorMessage)
      } finally {
        setIsLoadingMessages(false)
        setIsLoadingMoreMessages(false)
      }
    },
    [apiCall, messagesPerPage, onError]
  )

  // Load online users
  const loadOnlineUsers = useCallback(async () => {
    if (!currentRoom) return

    try {
      const data = await apiCall(`/chat/rooms/${currentRoom.id}/users`)
      setOnlineUsers(data.users || data)
    } catch (err) {
      console.error('Error loading online users:', err)
    }
  }, [currentRoom, apiCall])

  // Join a room
  const joinRoom = useCallback(
    async (roomId: string): Promise<boolean> => {
      try {
        setIsLoading(true)
        setError(null)

        // 检查是否已经在目标房间中
        if (currentRoom?.id.toString() === roomId) {
          console.log('Already in target room, skipping join')
          return true
        }

        // 只有在有当前房间且不是目标房间时才离开
        if (currentRoom && currentRoom.id.toString() !== roomId) {
          console.log('Leaving current room before joining new one:', currentRoom.id)
          await leaveRoom()
        }

        // Join new room via API
        await apiCall(`/chat/rooms/${roomId}/join`, { method: 'POST' })

        // Find room in list
        const room = rooms.find(r => r.id.toString() === roomId)
        if (!room) {
          throw new Error('Room not found')
        }

        setCurrentRoom(room)
        setMessages([])
        setOnlineUsers([])
        resetPage()
        setHasMoreMessages(true)
        isInitialLoad.current = true

        // Connect WebSocket to room
        const connected = await connect(roomId)
        if (!connected) {
          throw new Error('Failed to connect to WebSocket')
        }

        // Load initial data
        await Promise.all([loadMessages(roomId, 1), loadOnlineUsers()])

        return true
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to join room'
        setError(errorMessage)
        if (onError) onError(errorMessage)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [currentRoom, rooms, connect, onError, apiCall, leaveRoom, loadMessages, loadOnlineUsers]
  )

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!currentRoom || !hasMoreMessages || isLoadingMoreMessages) return

    await loadMessages(currentRoom.id.toString(), currentPage + 1)
  }, [currentRoom, hasMoreMessages, isLoadingMoreMessages, loadMessages, currentPage])

  // Send message
  const sendMessage = useCallback(
    async (roomId: string, message: string): Promise<SendMessageResult> => {
      if (!message.trim()) return { success: false }

      return await wsSendMessage(roomId, message.trim())
    },
    [wsSendMessage]
  )

  // Auto-load rooms on mount
  useEffect(() => {
    if (autoLoadRooms) {
      loadRooms()
    }
  }, [autoLoadRooms, loadRooms]) // Include loadRooms in dependencies

  // Cleanup on unmount - safe cleanup without state updates
  useEffect(() => {
    return () => {
      // Only call disconnect, avoid state updates during cleanup
      disconnect()
    }
  }, [disconnect])

  return {
    // Room management
    rooms,
    currentRoom,
    joinRoom,
    leaveRoom,
    createRoom,
    loadRooms,

    // Messages
    messages,
    sendMessage,
    loadMoreMessages,
    hasMoreMessages,

    // Users
    onlineUsers,
    loadOnlineUsers,

    // State
    isLoading,
    isLoadingMessages,
    isLoadingMoreMessages,
    error,
    isConnected,
  }
}
