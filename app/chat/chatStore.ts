import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ChatRoom, ChatMessage, OnlineUser, CreateRoomData, MessagePagination } from './types'
import { get as apiGet, post as apiPost } from '@/lib/api'
import { handleChatApiError, type ChatApiError } from '@/lib/api/chat-error-handler'
import chatCache from '@/lib/cache/chat-cache'
import useAuthStore from '@/stores/authStore'

interface NotificationSettings {
  browserNotifications: boolean
  soundNotifications: boolean
  mentionNotifications: boolean
  roomNotifications: boolean
}

interface RoomNotification {
  roomId: number
  unreadCount: number
  lastMessageAt: string
  hasMentions: boolean
}

interface MentionInfo {
  messageId: number
  roomId: number
  mentionedAt: string
  isRead: boolean
}

interface ChatState {
  // Core state
  currentRoom: ChatRoom | null
  rooms: ChatRoom[]
  messages: Record<string, ChatMessage[]>
  onlineUsers: Record<string, OnlineUser[]>
  messagesPagination: Record<string, MessagePagination>

  // UI state
  isLoading: boolean
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected'
  error: ChatApiError | null
  lastError: ChatApiError | null

  // Mute state
  isUserMuted: boolean
  muteUntil: string | null
  muteReason: string | null

  // Notification state
  notifications: Record<string, RoomNotification>
  mentions: MentionInfo[]
  notificationSettings: NotificationSettings
  totalUnreadCount: number
  browserNotificationPermission: NotificationPermission

  // Room operations
  setCurrentRoom: (room: ChatRoom | null) => void
  setRooms: (rooms: ChatRoom[]) => void
  loadRooms: () => Promise<void>
  createRoom: (roomData: CreateRoomData) => Promise<ChatRoom>
  joinRoom: (roomId: number) => Promise<void>
  leaveRoom: (roomId: number) => Promise<void>

  // Message operations
  addMessage: (roomId: number, message: ChatMessage) => void
  loadMessages: (roomId: number, page?: number) => Promise<void>
  loadMoreMessages: (roomId: number) => Promise<void>
  clearMessages: (roomId: number) => void

  // User presence operations
  updateOnlineUsers: (roomId: number, users: OnlineUser[]) => void
  addOnlineUser: (roomId: number, user: OnlineUser) => void
  removeOnlineUser: (roomId: number, userId: number) => void
  loadOnlineUsers: (roomId: number) => Promise<void>

  // Connection management
  setConnectionStatus: (status: 'connecting' | 'connected' | 'disconnected') => void
  setConnected: (connected: boolean) => void

  // Notification operations
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void
  requestBrowserNotificationPermission: () => Promise<NotificationPermission>
  showBrowserNotification: (title: string, options?: NotificationOptions) => void
  incrementUnreadCount: (roomId: number) => void
  clearRoomNotifications: (roomId: number) => void
  addMention: (mention: MentionInfo) => void
  markMentionAsRead: (messageId: number) => void
  clearAllNotifications: () => void
  getTotalUnreadCount: () => number
  getRoomUnreadCount: (roomId: number) => number
  hasUnreadMentions: (roomId?: number) => boolean

  // Error handling
  setError: (error: ChatApiError | null) => void
  clearError: () => void
  retryLastAction: () => Promise<void>

  // Mute operations
  updateMuteStatus: (isMuted: boolean, until?: string, reason?: string) => void
  checkMuteStatus: () => boolean

  // Utility actions
  setLoading: (loading: boolean) => void
  reset: () => void
}

const initialState = {
  currentRoom: null,
  rooms: [],
  messages: {},
  onlineUsers: {},
  messagesPagination: {},
  isLoading: false,
  isConnected: false,
  connectionStatus: 'disconnected' as const,
  error: null,
  lastError: null,
  isUserMuted: false,
  muteUntil: null,
  muteReason: null,

  // Notification state
  notifications: {},
  mentions: [],
  notificationSettings: {
    browserNotifications: true,
    soundNotifications: true,
    mentionNotifications: true,
    roomNotifications: true,
  },
  totalUnreadCount: 0,
  browserNotificationPermission: 'default' as NotificationPermission,
}

const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Room operations
      setCurrentRoom: room => {
        console.log('🔥 ChatStore: Setting current room:', room)

        set({ currentRoom: room })

        // 确保当前房间在房间列表中
        if (room) {
          const { rooms } = get()
          const roomExists = rooms.find(r => r.id === room.id)
          if (!roomExists) {
            console.log('🔥 ChatStore: Adding current room to rooms list:', room)
            set(state => ({
              rooms: [...state.rooms, room],
            }))
          }

          // Clear notifications when entering a room
          get().clearRoomNotifications(room.id)

          // Mark all mentions in this room as read
          const { mentions } = get()
          const updatedMentions = mentions.map(mention =>
            mention.roomId === room.id ? { ...mention, isRead: true } : mention
          )
          set({ mentions: updatedMentions })
        }

        // Update room focus tracking for better notification management
        if (typeof document !== 'undefined') {
          // Clear notifications when room becomes active and tab is visible
          if (room && !document.hidden) {
            setTimeout(() => {
              get().clearRoomNotifications(room.id)
            }, 100)
          }
        }
      },

      setRooms: rooms => {
        // Ensure rooms is always an array
        const safeRooms = Array.isArray(rooms) ? rooms : []
        set({ rooms: safeRooms })
      },

      loadRooms: (() => {
        let loading = false
        let lastLoadTime = 0
        const DEBOUNCE_TIME = 1000 // 1 second debounce

        return async () => {
          const now = Date.now()

          // Prevent rapid successive calls
          if (loading || now - lastLoadTime < DEBOUNCE_TIME) {
            console.log('loadRooms: Skipping duplicate call')
            return
          }

          loading = true
          lastLoadTime = now
          set({ isLoading: true, error: null })

          try {
            console.log('🔥 ChatStore: Loading rooms from API...')
            console.log('🔥 ChatStore: Current auth state:', {
              isAuthenticated: useAuthStore.getState().isAuthenticated,
              hasToken: !!useAuthStore.getState().token,
            })
            const rooms = await apiGet<ChatRoom[]>('/chat/rooms')
            console.log('🔥 ChatStore: API returned rooms:', rooms)

            // Ensure rooms is an array before setting
            const safeRooms = Array.isArray(rooms) ? rooms : []
            console.log('🔥 ChatStore: Setting rooms:', safeRooms.length, 'rooms')

            set({ rooms: safeRooms, isLoading: false })

            // 如果当前房间不在房间列表中，但存在，则添加到列表中
            const currentRoom = get().currentRoom
            if (currentRoom && !safeRooms.find(room => room.id === currentRoom.id)) {
              console.log('🔥 ChatStore: Current room not in list, adding it:', currentRoom)
              set(state => ({
                rooms: [...state.rooms, currentRoom],
              }))
            }
          } catch (error) {
            console.error('🔥 ChatStore: Failed to load rooms:', error)
            const chatError = handleChatApiError(error, 'Failed to load chat rooms', {
              showToast: true,
              retryable: true,
            })
            set({
              error: chatError,
              lastError: chatError,
              isLoading: false,
            })
            throw chatError
          } finally {
            loading = false
          }
        }
      })(),

      createRoom: async roomData => {
        set({ isLoading: true, error: null })
        try {
          const newRoom = await apiPost<ChatRoom>('/chat/rooms', roomData)
          set(state => ({
            rooms: [...state.rooms, newRoom],
            isLoading: false,
          }))
          return newRoom
        } catch (error) {
          const chatError = handleChatApiError(error, 'Failed to create chat room', {
            showToast: true,
            retryable: true,
          })
          set({
            error: chatError,
            lastError: chatError,
            isLoading: false,
          })
          throw chatError
        }
      },

      joinRoom: async roomId => {
        set({ error: null })
        try {
          await apiPost(`/chat/rooms/${roomId}/join`, {})
        } catch (error) {
          const chatError = handleChatApiError(error, 'Failed to join chat room', {
            showToast: true,
            retryable: true,
          })
          set({
            error: chatError,
            lastError: chatError,
          })
          throw chatError
        }
      },

      leaveRoom: async roomId => {
        try {
          await apiPost(`/chat/rooms/${roomId}/leave`, {})

          // Clear room-specific data when leaving
          set(state => {
            const newMessages = { ...state.messages }
            const newOnlineUsers = { ...state.onlineUsers }
            const newPagination = { ...state.messagesPagination }

            delete newMessages[roomId.toString()]
            delete newOnlineUsers[roomId.toString()]
            delete newPagination[roomId.toString()]

            return {
              messages: newMessages,
              onlineUsers: newOnlineUsers,
              messagesPagination: newPagination,
              currentRoom: state.currentRoom?.id === roomId ? null : state.currentRoom,
              error: null,
            }
          })
        } catch (error) {
          const chatError = handleChatApiError(error, 'Failed to leave chat room', {
            showToast: true,
            retryable: true,
          })
          set({
            error: chatError,
            lastError: chatError,
          })
          throw chatError
        }
      },

      // Message operations
      addMessage: (roomId, message) => {
        console.log('🔥 ChatStore: Adding message:', { roomId, message })

        const state = get()
        const roomKey = roomId.toString()
        const currentMessages = state.messages[roomKey] || []

        console.log('🔥 ChatStore: Current state:', {
          roomKey,
          currentMessagesCount: currentMessages.length,
          allRoomKeys: Object.keys(state.messages),
          messageId: message.id,
          messageContent: message.message,
        })

        // Avoid duplicate messages
        const messageExists = currentMessages.some(m => m.id === message.id)
        if (messageExists) {
          console.log('🔥 ChatStore: Message already exists, skipping:', message.id)
          return
        }

        console.log('🔥 ChatStore: Adding new message to room:', roomKey)

        // Add to cache
        chatCache.addMessageToCache(roomKey, message)

        // Update messages - 使用函数式更新确保重新渲染
        set(prevState => {
          const newMessages = {
            ...prevState.messages,
            [roomKey]: [...(prevState.messages[roomKey] || []), message],
          }

          console.log('🔥 ChatStore: Updated messages state:', {
            roomKey,
            newCount: newMessages[roomKey].length,
            lastMessage: newMessages[roomKey][newMessages[roomKey].length - 1]?.message,
          })

          // 强制触发订阅者更新
          console.log('🔥 ChatStore: Triggering state update with new messages object')
          return {
            ...prevState,
            messages: newMessages,
          }
        })

        // 验证更新后的状态
        setTimeout(() => {
          const updatedState = get()
          console.log('🔥 ChatStore: Final state after update:', {
            roomKey,
            finalCount: updatedState.messages[roomKey]?.length || 0,
            allRoomKeys: Object.keys(updatedState.messages),
          })
        }, 100)

        // Handle notifications for new messages
        const isCurrentRoom = state.currentRoom?.id === roomId
        const isOwnMessage = false // This should check against current user ID from auth store

        // Only create notifications for messages from other users
        if (!isOwnMessage && message.message_type === 'text') {
          // Increment unread count if not in current room or tab is not active
          if (!isCurrentRoom || (typeof document !== 'undefined' && document.hidden)) {
            get().incrementUnreadCount(roomId)
          }

          // Check for mentions (simplified - would need proper user context)
          const mentionRegex = /@\w+/g
          const mentions = message.message.match(mentionRegex)
          if (mentions && state.notificationSettings.mentionNotifications) {
            // For demo purposes, assume any mention could be for current user
            get().addMention({
              messageId: message.id,
              roomId: roomId,
              mentionedAt: message.created_at,
              isRead: false,
            })

            // Show browser notification for mentions
            if (state.notificationSettings.browserNotifications) {
              get().showBrowserNotification(`${message.user.name} mentioned you`, {
                body: message.message,
                tag: `mention-${message.id}`,
              })
            }
          }

          // Show browser notification for new messages in inactive rooms
          if (!isCurrentRoom && state.notificationSettings.roomNotifications) {
            const room = state.rooms.find(r => r.id === roomId)
            if (room) {
              get().showBrowserNotification(`New message in ${room.name}`, {
                body: `${message.user.name}: ${message.message}`,
                tag: `room-${roomId}`,
              })
            }
          }
        }
      },

      loadMessages: async (roomId, page = 1) => {
        console.log('ChatStore: Loading messages for room:', roomId, 'page:', page)

        const roomKey = roomId.toString()

        // Check cache first for page 1
        if (page === 1) {
          const cached = chatCache.getCachedMessages(roomKey)
          if (cached) {
            console.log('ChatStore: Using cached messages for room:', roomKey)
            set(state => ({
              messages: {
                ...state.messages,
                [roomKey]: cached.messages,
              },
              messagesPagination: {
                ...state.messagesPagination,
                [roomKey]: cached.pagination as MessagePagination,
              },
              isLoading: false,
            }))
            return
          }
        }

        set({ isLoading: true, error: null })
        try {
          const response = await apiGet<{ messages: ChatMessage[]; pagination: MessagePagination }>(
            `/chat/rooms/${roomId}/messages?page=${page}`
          )
          console.log('ChatStore: API response:', response)

          // Transform API response to match MessagePagination format
          const paginationData: MessagePagination = {
            data: response.messages,
            current_page: response.pagination.current_page,
            last_page: response.pagination.last_page || 1,
            per_page: response.pagination.per_page || 50,
            total: response.pagination.total || response.messages.length,
            has_more: response.pagination.has_more_pages || false,
          }

          // Cache the messages for page 1
          if (page === 1) {
            chatCache.cacheMessages(roomKey, response.messages, paginationData)
          }

          console.log(
            'ChatStore: Setting messages for room:',
            roomKey,
            'count:',
            response.messages.length
          )

          set(state => ({
            messages: {
              ...state.messages,
              [roomKey]: page === 1 ? response.messages : response.messages,
            },
            messagesPagination: {
              ...state.messagesPagination,
              [roomKey]: paginationData,
            },
            isLoading: false,
          }))
        } catch (error) {
          const chatError = handleChatApiError(error, 'Failed to load messages', {
            showToast: true,
            retryable: true,
          })
          set({
            error: chatError,
            lastError: chatError,
            isLoading: false,
          })
          throw chatError
        }
      },

      loadMoreMessages: async roomId => {
        const roomKey = roomId.toString()
        const currentPagination = get().messagesPagination[roomKey]

        if (!currentPagination || !currentPagination.has_more) {
          return
        }

        const nextPage = currentPagination.current_page + 1

        try {
          const response = await apiGet<{ messages: ChatMessage[]; pagination: MessagePagination }>(
            `/chat/rooms/${roomId}/messages?page=${nextPage}`
          )

          // Transform API response to match MessagePagination format
          const paginationData: MessagePagination = {
            data: response.messages,
            current_page: response.pagination.current_page,
            last_page: response.pagination.last_page || 1,
            per_page: response.pagination.per_page || 50,
            total: response.pagination.total || response.messages.length,
            has_more: response.pagination.has_more_pages || false,
          }

          set(state => {
            const currentMessages = state.messages[roomKey] || []

            return {
              messages: {
                ...state.messages,
                [roomKey]: [...response.messages, ...currentMessages], // Prepend older messages
              },
              messagesPagination: {
                ...state.messagesPagination,
                [roomKey]: paginationData,
              },
              error: null,
            }
          })
        } catch (error) {
          const chatError = handleChatApiError(error, 'Failed to load more messages', {
            showToast: true,
            retryable: true,
          })
          set({
            error: chatError,
            lastError: chatError,
          })
          throw chatError
        }
      },

      clearMessages: roomId => {
        set(state => {
          const roomKey = roomId.toString()
          const newMessages = { ...state.messages }
          const newPagination = { ...state.messagesPagination }

          delete newMessages[roomKey]
          delete newPagination[roomKey]

          return {
            messages: newMessages,
            messagesPagination: newPagination,
          }
        })
      },

      // User presence operations
      updateOnlineUsers: (roomId, users) => {
        set(state => ({
          onlineUsers: {
            ...state.onlineUsers,
            [roomId.toString()]: users,
          },
        }))
      },

      addOnlineUser: (roomId, user) => {
        set(state => {
          const roomKey = roomId.toString()
          const currentUsers = state.onlineUsers[roomKey] || []

          // Avoid duplicate users
          const userExists = currentUsers.some(u => u.id === user.id)
          if (userExists) return state

          return {
            onlineUsers: {
              ...state.onlineUsers,
              [roomKey]: [...currentUsers, user],
            },
          }
        })
      },

      removeOnlineUser: (roomId, userId) => {
        set(state => {
          const roomKey = roomId.toString()
          const currentUsers = state.onlineUsers[roomKey] || []

          return {
            onlineUsers: {
              ...state.onlineUsers,
              [roomKey]: currentUsers.filter(u => u.id !== userId),
            },
          }
        })
      },

      loadOnlineUsers: async roomId => {
        try {
          const response = await apiGet<{ online_users: OnlineUser[]; count: number }>(
            `/chat/rooms/${roomId}/users`
          )
          set(state => ({
            onlineUsers: {
              ...state.onlineUsers,
              [roomId.toString()]: response.online_users || [],
            },
          }))
        } catch (error) {
          console.error('Failed to load online users:', error)
          const chatError = handleChatApiError(error, 'Failed to load online users', {
            showToast: false,
            retryable: true,
          })
          set({ error: chatError })
        }
      },

      // Connection management
      setConnectionStatus: status => {
        set({
          connectionStatus: status,
          isConnected: status === 'connected',
        })
      },

      setConnected: connected => {
        set({
          isConnected: connected,
          connectionStatus: connected ? 'connected' : 'disconnected',
        })
      },

      // Notification operations
      updateNotificationSettings: settings => {
        set(state => ({
          notificationSettings: {
            ...state.notificationSettings,
            ...settings,
          },
        }))
      },

      requestBrowserNotificationPermission: async () => {
        if (!('Notification' in window)) {
          set({ browserNotificationPermission: 'denied' })
          return 'denied'
        }

        const permission = await Notification.requestPermission()
        set({ browserNotificationPermission: permission })
        return permission
      },

      showBrowserNotification: (title, options = {}) => {
        const { notificationSettings, browserNotificationPermission } = get()

        if (
          !notificationSettings.browserNotifications ||
          browserNotificationPermission !== 'granted' ||
          !('Notification' in window)
        ) {
          return
        }

        // Don't show notification if the tab is active
        if (!document.hidden) {
          return
        }

        new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        })
      },

      incrementUnreadCount: roomId => {
        set(state => {
          const roomKey = roomId.toString()
          const currentNotification = state.notifications[roomKey] || {
            roomId,
            unreadCount: 0,
            lastMessageAt: new Date().toISOString(),
            hasMentions: false,
          }

          const updatedNotification = {
            ...currentNotification,
            unreadCount: currentNotification.unreadCount + 1,
            lastMessageAt: new Date().toISOString(),
          }

          const newNotifications = {
            ...state.notifications,
            [roomKey]: updatedNotification,
          }

          // Calculate total unread count
          const totalUnreadCount = Object.values(newNotifications).reduce(
            (total, notification) => total + notification.unreadCount,
            0
          )

          return {
            notifications: newNotifications,
            totalUnreadCount,
          }
        })
      },

      clearRoomNotifications: roomId => {
        set(state => {
          const roomKey = roomId.toString()
          const newNotifications = { ...state.notifications }
          delete newNotifications[roomKey]

          // Calculate total unread count
          const totalUnreadCount = Object.values(newNotifications).reduce(
            (total, notification) => total + notification.unreadCount,
            0
          )

          // Clear mentions for this room
          const newMentions = state.mentions.filter(mention => mention.roomId !== roomId)

          return {
            notifications: newNotifications,
            mentions: newMentions,
            totalUnreadCount,
          }
        })
      },

      addMention: mention => {
        set(state => {
          // Avoid duplicate mentions
          const mentionExists = state.mentions.some(m => m.messageId === mention.messageId)
          if (mentionExists) return state

          const roomKey = mention.roomId.toString()
          const currentNotification = state.notifications[roomKey] || {
            roomId: mention.roomId,
            unreadCount: 0,
            lastMessageAt: mention.mentionedAt,
            hasMentions: false,
          }

          const updatedNotification = {
            ...currentNotification,
            hasMentions: true,
            lastMessageAt: mention.mentionedAt,
          }

          return {
            mentions: [...state.mentions, mention],
            notifications: {
              ...state.notifications,
              [roomKey]: updatedNotification,
            },
          }
        })
      },

      markMentionAsRead: messageId => {
        set(state => ({
          mentions: state.mentions.map(mention =>
            mention.messageId === messageId ? { ...mention, isRead: true } : mention
          ),
        }))
      },

      clearAllNotifications: () => {
        set({
          notifications: {},
          mentions: [],
          totalUnreadCount: 0,
        })
      },

      getTotalUnreadCount: () => {
        return get().totalUnreadCount
      },

      getRoomUnreadCount: roomId => {
        const roomKey = roomId.toString()
        return get().notifications[roomKey]?.unreadCount || 0
      },

      hasUnreadMentions: roomId => {
        const { mentions } = get()
        if (roomId) {
          return mentions.some(mention => mention.roomId === roomId && !mention.isRead)
        }
        return mentions.some(mention => !mention.isRead)
      },

      // Error handling
      setError: error => set({ error, lastError: error }),

      clearError: () => set({ error: null }),

      retryLastAction: async () => {
        const { lastError } = get()
        if (!lastError || !lastError.retryable) {
          return
        }

        // This would need to be implemented based on the specific action that failed
        // For now, we'll just clear the error
        set({ error: null })
      },

      // Mute operations
      updateMuteStatus: (isMuted, until, reason) => {
        set({
          isUserMuted: isMuted,
          muteUntil: until || null,
          muteReason: reason || null,
        })
      },

      checkMuteStatus: () => {
        const { isUserMuted, muteUntil } = get()

        if (!isUserMuted) {
          return false
        }

        // If there's a mute expiration time, check if it's still valid
        if (muteUntil) {
          const muteUntilDate = new Date(muteUntil)
          const now = new Date()

          if (muteUntilDate <= now) {
            // Automatically unmute if the time has passed
            set({
              isUserMuted: false,
              muteUntil: null,
              muteReason: null,
            })
            return false
          }
        }

        return true
      },

      // Utility actions
      setLoading: loading => set({ isLoading: loading }),

      reset: () => set(initialState),
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist essential data, not UI state
      partialize: state => ({
        currentRoom: state.currentRoom,
        rooms: state.rooms,
        messages: state.messages,
        messagesPagination: state.messagesPagination,
        notifications: state.notifications,
        mentions: state.mentions,
        notificationSettings: state.notificationSettings,
        totalUnreadCount: state.totalUnreadCount,
      }),
      // Clear loading state on rehydration
      onRehydrateStorage: () => state => {
        if (state) {
          state.isLoading = false
          state.isConnected = false
          state.connectionStatus = 'disconnected'
          state.error = null

          // Check browser notification permission on rehydration
          if (typeof window !== 'undefined' && 'Notification' in window) {
            state.browserNotificationPermission = Notification.permission
          } else {
            state.browserNotificationPermission = 'denied'
          }

          // 状态恢复后检查并修复状态不一致问题
          if (state.currentRoom && state.rooms.length === 0) {
            console.log(
              '🔥 ChatStore: Detected state inconsistency - currentRoom exists but no rooms list'
            )
            console.log('🔥 ChatStore: Current room:', state.currentRoom)

            // 将当前房间添加到房间列表中
            state.rooms = [state.currentRoom]
            console.log('🔥 ChatStore: Fixed state - added current room to rooms list')
          }

          // Note: Visibility change listener is now handled in useNotifications hook
          // to avoid circular dependencies in store initialization
        }
      },
    }
  )
)

export default useChatStore
export { useChatStore }
