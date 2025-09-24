// 2025-09-24 claude-4-sonnet 优化过本文件代码：「优化代码」

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
  // 核心状态
  currentRoom: ChatRoom | null
  rooms: ChatRoom[]
  messages: Record<string, ChatMessage[]>
  onlineUsers: Record<string, OnlineUser[]>
  messagesPagination: Record<string, MessagePagination>

  // UI 状态
  isLoading: boolean
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected'
  error: ChatApiError | null
  lastError: ChatApiError | null

  // 禁言状态
  isUserMuted: boolean
  muteUntil: string | null
  muteReason: string | null

  // 通知状态
  notifications: Record<string, RoomNotification>
  mentions: MentionInfo[]
  notificationSettings: NotificationSettings
  totalUnreadCount: number
  browserNotificationPermission: NotificationPermission

  // 房间操作
  setCurrentRoom: (room: ChatRoom | null) => void
  setRooms: (rooms: ChatRoom[]) => void
  loadRooms: () => Promise<void>
  createRoom: (roomData: CreateRoomData) => Promise<ChatRoom>
  joinRoom: (roomId: number) => Promise<void>
  leaveRoom: (roomId: number) => Promise<void>

  // 消息操作
  addMessage: (roomId: number, message: ChatMessage) => void
  loadMessages: (roomId: number, page?: number) => Promise<void>
  loadMoreMessages: (roomId: number) => Promise<void>
  clearMessages: (roomId: number) => void

  // 用户在线状态操作
  updateOnlineUsers: (roomId: number, users: OnlineUser[]) => void
  addOnlineUser: (roomId: number, user: OnlineUser) => void
  removeOnlineUser: (roomId: number, userId: number) => void
  loadOnlineUsers: (roomId: number) => Promise<void>
  updateRoomOnlineCount: (roomId: number, onlineCount: number) => void

  // 连接管理
  setConnectionStatus: (status: 'connecting' | 'connected' | 'disconnected') => void
  setConnected: (connected: boolean) => void

  // 通知操作
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

  // 错误处理
  setError: (error: ChatApiError | null) => void
  clearError: () => void
  retryLastAction: () => Promise<void>

  // 禁言操作
  updateMuteStatus: (isMuted: boolean, until?: string, reason?: string) => void
  checkMuteStatus: () => boolean

  // 工具方法
  setLoading: (loading: boolean) => void
  reset: () => void
  clearAllOnlineUsers: () => void
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

  // 通知状态
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

// 防抖和节流工具函数
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createThrottledFunction = <T extends (...args: any[]) => any>(fn: T, delay: number): T => {
  let loading = false
  let lastLoadTime = 0

  return ((...args: Parameters<T>) => {
    const now = Date.now()
    if (loading || now - lastLoadTime < delay) {
      console.log(`Throttled function call skipped (${fn.name})`)
      return Promise.resolve()
    }

    loading = true
    lastLoadTime = now

    const result = fn(...args)
    if (result instanceof Promise) {
      return result.finally(() => {
        loading = false
      })
    } else {
      loading = false
      return result
    }
  }) as T
}

// 工具函数：获取当前用户ID
const getCurrentUserId = (): number | null => {
  return useAuthStore.getState().user?.id || null
}

// 工具函数：检查是否为自己的消息
const isOwnMessage = (message: ChatMessage): boolean => {
  const currentUserId = getCurrentUserId()
  return currentUserId ? message.user.id === currentUserId : false
}

// 工具函数：清理房间数据
const cleanRoomData = (state: ChatState, roomId: number) => {
  const roomKey = roomId.toString()
  const newState = { ...state }

  // 清理消息数据
  delete newState.messages[roomKey]
  delete newState.onlineUsers[roomKey]
  delete newState.messagesPagination[roomKey]

  // 清理通知数据
  delete newState.notifications[roomKey]
  newState.mentions = newState.mentions.filter(mention => mention.roomId !== roomId)

  return newState
}

const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // 房间操作
      setCurrentRoom: room => {
        console.log('聊天室状态: 设置当前房间:', room)

        set(state => {
          const newState = { ...state, currentRoom: room }

          // 确保当前房间在房间列表中
          if (room) {
            const roomExists = state.rooms.find(r => r.id === room.id)
            if (!roomExists) {
              console.log('聊天室状态: 将当前房间添加到房间列表:', room)
              newState.rooms = [...state.rooms, room]
            }

            // 清理其他房间的在线用户数据
            const cleanedOnlineUsers: Record<string, OnlineUser[]> = {}
            cleanedOnlineUsers[room.id.toString()] = state.onlineUsers[room.id.toString()] || []
            newState.onlineUsers = cleanedOnlineUsers

            console.log('聊天室状态: 清理其他房间的在线用户数据，只保留房间', room.id)
          } else {
            // 如果没有当前房间，清空所有在线用户数据
            console.log('聊天室状态: 没有当前房间，清空所有在线用户数据')
            newState.onlineUsers = {}
          }

          return newState
        })

        // 异步处理通知清理和标记已读
        if (room) {
          setTimeout(() => {
            const currentState = get()

            // 清理房间通知
            currentState.clearRoomNotifications(room.id)

            // 标记该房间的所有提及为已读
            const updatedMentions = currentState.mentions.map(mention =>
              mention.roomId === room.id ? { ...mention, isRead: true } : mention
            )
            set({ mentions: updatedMentions })
          }, 100)
        }
      },

      setRooms: rooms => {
        const safeRooms = Array.isArray(rooms) ? rooms : []
        set({ rooms: safeRooms })
      },

      // 使用节流的房间加载函数
      loadRooms: createThrottledFunction(async () => {
        set({ isLoading: true, error: null })

        try {
          console.log('聊天室状态: 从API加载房间...')
          const authState = useAuthStore.getState()
          console.log('聊天室状态: 当前认证状态:', {
            isAuthenticated: authState.isAuthenticated,
            hasToken: !!authState.token,
          })

          const response = await apiGet<{ rooms: ChatRoom[] }>('/chat/rooms')
          const rooms = response.rooms || []
          console.log('聊天室状态: API返回房间:', rooms)

          const safeRooms = Array.isArray(rooms) ? rooms : []
          console.log('聊天室状态: 设置房间:', safeRooms.length, '个房间')

          set(state => {
            const newState = { rooms: safeRooms, isLoading: false }

            // 如果当前房间不在房间列表中，但存在，则添加到列表中
            if (state.currentRoom && !safeRooms.find(room => room.id === state.currentRoom!.id)) {
              console.log('聊天室状态: 当前房间不在列表中，添加它:', state.currentRoom)
              newState.rooms = [...safeRooms, state.currentRoom]
            }

            return newState
          })
        } catch (error) {
          console.error('聊天室状态: 加载房间失败:', error)
          const chatError = handleChatApiError(error, '加载聊天室失败', {
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
      }, 1000),

      createRoom: async roomData => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiPost<{ room: ChatRoom }>('/chat/rooms', roomData)
          const newRoom = response.room
          set(state => ({
            rooms: [...state.rooms, newRoom],
            isLoading: false,
          }))
          return newRoom
        } catch (error) {
          const chatError = handleChatApiError(error, '创建聊天室失败', {
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
          const chatError = handleChatApiError(error, '加入聊天室失败', {
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

          // 离开房间时清理房间特定数据
          set(state => {
            const newState = cleanRoomData(state, roomId)

            // 如果离开的是当前房间，则清除当前房间
            if (state.currentRoom?.id === roomId) {
              newState.currentRoom = null
            }

            newState.error = null
            return newState
          })
        } catch (error) {
          const chatError = handleChatApiError(error, '离开聊天室失败', {
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

      // 消息操作
      addMessage: (roomId, message) => {
        console.log('聊天室状态: 添加消息:', { roomId, message })

        const state = get()
        const roomKey = roomId.toString()
        const currentMessages = state.messages[roomKey] || []

        // 避免重复消息
        const messageExists = currentMessages.some(m => m.id === message.id)
        if (messageExists) {
          console.log('聊天室状态: 消息已存在，跳过:', message.id)
          return
        }

        console.log('聊天室状态: 添加新消息到房间:', roomKey)

        // 添加到缓存
        chatCache.addMessageToCache(roomKey, message)

        // 更新消息状态 - 使用函数式更新确保重新渲染
        set(prevState => {
          const newMessages = {
            ...prevState.messages,
            [roomKey]: [...(prevState.messages[roomKey] || []), message],
          }

          console.log('聊天室状态: 更新消息状态:', {
            roomKey,
            newCount: newMessages[roomKey].length,
            lastMessage: newMessages[roomKey][newMessages[roomKey].length - 1]?.message,
          })

          return {
            ...prevState,
            messages: newMessages,
          }
        })

        // 处理新消息的通知
        const isCurrentRoom = state.currentRoom?.id === roomId
        const isOwn = isOwnMessage(message)

        // 只为其他用户的消息创建通知
        if (!isOwn && message.message_type === 'text') {
          // 如果不在当前房间或标签页不活跃，增加未读计数
          if (!isCurrentRoom || (typeof document !== 'undefined' && document.hidden)) {
            get().incrementUnreadCount(roomId)
          }

          // 检查提及
          const mentionRegex = /@\w+/g
          const mentions = message.message.match(mentionRegex)
          if (mentions && state.notificationSettings.mentionNotifications) {
            get().addMention({
              messageId: message.id,
              roomId: roomId,
              mentionedAt: message.created_at,
              isRead: false,
            })

            // 显示提及的浏览器通知
            if (state.notificationSettings.browserNotifications) {
              get().showBrowserNotification(`${message.user.name} 提及了你`, {
                body: message.message,
                tag: `mention-${message.id}`,
              })
            }
          }

          // 为非活跃房间的新消息显示浏览器通知
          if (!isCurrentRoom && state.notificationSettings.roomNotifications) {
            const room = state.rooms.find(r => r.id === roomId)
            if (room) {
              get().showBrowserNotification(`${room.name} 有新消息`, {
                body: `${message.user.name}: ${message.message}`,
                tag: `room-${roomId}`,
              })
            }
          }
        }
      },

      loadMessages: async (roomId, page = 1) => {
        const roomKey = roomId.toString()

        // 首先检查缓存（仅对第一页）
        if (page === 1) {
          const cached = chatCache.getCachedMessages(roomKey)
          if (cached) {
            console.log('聊天室状态: 使用缓存的消息，房间:', roomKey)
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
          console.log('聊天室状态: API响应:', response)

          // 转换API响应以匹配MessagePagination格式
          const paginationData: MessagePagination = {
            data: response.messages,
            current_page: response.pagination.current_page,
            last_page: response.pagination.last_page || 1,
            per_page: response.pagination.per_page || 50,
            total: response.pagination.total || response.messages.length,
            has_more: response.pagination.has_more_pages || false,
          }

          // 缓存第一页的消息
          if (page === 1) {
            chatCache.cacheMessages(roomKey, response.messages, paginationData)
          }

          console.log('聊天室状态: 为房间设置消息:', roomKey, '数量:', response.messages.length)

          set(state => ({
            messages: {
              ...state.messages,
              [roomKey]: response.messages,
            },
            messagesPagination: {
              ...state.messagesPagination,
              [roomKey]: paginationData,
            },
            isLoading: false,
          }))
        } catch (error) {
          const chatError = handleChatApiError(error, '加载消息失败', {
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
                [roomKey]: [...response.messages, ...currentMessages], // 将较旧的消息添加到前面
              },
              messagesPagination: {
                ...state.messagesPagination,
                [roomKey]: paginationData,
              },
              error: null,
            }
          })
        } catch (error) {
          const chatError = handleChatApiError(error, '加载更多消息失败', {
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
          const newState = { ...state }
          const roomKey = roomId.toString()

          delete newState.messages[roomKey]
          delete newState.messagesPagination[roomKey]

          return newState
        })
      },

      // 用户在线状态操作
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

          // 避免重复用户
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

      // 使用节流的在线用户加载函数
      loadOnlineUsers: createThrottledFunction(async (roomId: number) => {
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
          console.error('加载在线用户失败:', error)
          const chatError = handleChatApiError(error, '加载在线用户失败', {
            showToast: false,
            retryable: true,
          })
          set({ error: chatError })
        }
      }, 5000),

      updateRoomOnlineCount: (roomId, onlineCount) => {
        console.log('聊天室状态: 更新房间在线人数:', { roomId, onlineCount })
        set(state => ({
          rooms: state.rooms.map(room =>
            room.id === roomId ? { ...room, online_count: onlineCount } : room
          ),
        }))
      },

      // 连接管理
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

      // 通知操作
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
          !('Notification' in window) ||
          !document.hidden // 如果标签页活跃则不显示通知
        ) {
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

          // 计算总未读数
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

          // 计算总未读数
          const totalUnreadCount = Object.values(newNotifications).reduce(
            (total, notification) => total + notification.unreadCount,
            0
          )

          // 清理该房间的提及
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
          // 避免重复提及
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

      // 错误处理
      setError: error => set({ error, lastError: error }),

      clearError: () => set({ error: null }),

      retryLastAction: async () => {
        const { lastError } = get()
        if (!lastError || !lastError.retryable) {
          return
        }

        // 这需要根据失败的具体操作来实现
        // 目前只是清除错误
        set({ error: null })
      },

      // 禁言操作
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

        // 如果有禁言过期时间，检查是否仍然有效
        if (muteUntil) {
          const muteUntilDate = new Date(muteUntil)
          const now = new Date()

          if (muteUntilDate <= now) {
            // 如果时间已过，自动解除禁言
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

      // 工具方法
      setLoading: loading => set({ isLoading: loading }),

      clearAllOnlineUsers: () => {
        console.log('聊天室状态: 清空所有在线用户数据')
        set({ onlineUsers: {} })
      },

      reset: () => set(initialState),
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => localStorage),
      // 只持久化必要数据，不包括UI状态
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
      // 重新水化时清除加载状态
      onRehydrateStorage: () => state => {
        if (state) {
          state.isLoading = false
          state.isConnected = false
          state.connectionStatus = 'disconnected'
          state.error = null

          // 重新水化时检查浏览器通知权限
          if (typeof window !== 'undefined' && 'Notification' in window) {
            state.browserNotificationPermission = Notification.permission
          } else {
            state.browserNotificationPermission = 'denied'
          }

          // 状态恢复后检查并修复状态不一致问题
          if (state.currentRoom && state.rooms.length === 0) {
            console.log('聊天室状态: 检测到状态不一致 - 存在当前房间但没有房间列表')
            console.log('聊天室状态: 当前房间:', state.currentRoom)

            // 将当前房间添加到房间列表中
            state.rooms = [state.currentRoom]
            console.log('聊天室状态: 已修复状态 - 将当前房间添加到房间列表')
          }
        }
      },
    }
  )
)

export default useChatStore
export { useChatStore }
