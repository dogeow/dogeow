import type { ChatMessage, ChatRoom, ChatUser } from '@/app/chat/types'

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

interface MessageCache {
  [roomId: string]: {
    messages: ChatMessage[]
    pagination?: unknown
    lastUpdated: number
  }
}

interface UserCache {
  [userId: string]: {
    user: ChatUser
    lastUpdated: number
  }
}

interface RoomCache {
  [roomId: string]: {
    room: ChatRoom
    lastUpdated: number
  }
}

class ChatCacheManager {
  private messageCache: MessageCache = {}
  private userCache: UserCache = {}
  private roomCache: RoomCache = {}
  private onlineUsersCache: { [roomId: string]: CacheItem<ChatUser[]> } = {}

  // Cache TTL in milliseconds
  private readonly MESSAGE_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly USER_TTL = 10 * 60 * 1000 // 10 minutes
  private readonly ROOM_TTL = 15 * 60 * 1000 // 15 minutes
  private readonly ONLINE_USERS_TTL = 30 * 1000 // 30 seconds

  // Message caching
  cacheMessages(roomId: string, messages: ChatMessage[], pagination?: unknown): void {
    this.messageCache[roomId] = {
      messages: [...messages],
      pagination,
      lastUpdated: Date.now(),
    }
  }

  getCachedMessages(roomId: string): { messages: ChatMessage[]; pagination?: unknown } | null {
    const cached = this.messageCache[roomId]
    if (!cached) return null

    const isExpired = Date.now() - cached.lastUpdated > this.MESSAGE_TTL
    if (isExpired) {
      delete this.messageCache[roomId]
      return null
    }

    return {
      messages: [...cached.messages],
      pagination: cached.pagination,
    }
  }

  addMessageToCache(roomId: string, message: ChatMessage): void {
    const cached = this.messageCache[roomId]
    if (cached) {
      // Add message and keep sorted by created_at
      const messages = [...cached.messages, message].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )

      this.messageCache[roomId] = {
        ...cached,
        messages,
        lastUpdated: Date.now(),
      }
    }
  }

  removeMessageFromCache(roomId: string, messageId: number): void {
    const cached = this.messageCache[roomId]
    if (cached) {
      this.messageCache[roomId] = {
        ...cached,
        messages: cached.messages.filter(msg => msg.id !== messageId),
        lastUpdated: Date.now(),
      }
    }
  }

  updateMessageInCache(roomId: string, messageId: number, updates: Partial<ChatMessage>): void {
    const cached = this.messageCache[roomId]
    if (cached) {
      this.messageCache[roomId] = {
        ...cached,
        messages: cached.messages.map(msg => (msg.id === messageId ? { ...msg, ...updates } : msg)),
        lastUpdated: Date.now(),
      }
    }
  }

  // User caching
  cacheUser(user: ChatUser): void {
    this.userCache[user.id] = {
      user: { ...user },
      lastUpdated: Date.now(),
    }
  }

  getCachedUser(userId: string): ChatUser | null {
    const cached = this.userCache[userId]
    if (!cached) return null

    const isExpired = Date.now() - cached.lastUpdated > this.USER_TTL
    if (isExpired) {
      delete this.userCache[userId]
      return null
    }

    return { ...cached.user }
  }

  cacheUsers(users: ChatUser[]): void {
    users.forEach(user => this.cacheUser(user))
  }

  // Room caching
  cacheRoom(room: ChatRoom): void {
    this.roomCache[room.id] = {
      room: { ...room },
      lastUpdated: Date.now(),
    }
  }

  getCachedRoom(roomId: string): ChatRoom | null {
    const cached = this.roomCache[roomId]
    if (!cached) return null

    const isExpired = Date.now() - cached.lastUpdated > this.ROOM_TTL
    if (isExpired) {
      delete this.roomCache[roomId]
      return null
    }

    return { ...cached.room }
  }

  cacheRooms(rooms: ChatRoom[]): void {
    rooms.forEach(room => this.cacheRoom(room))
  }

  // Online users caching
  cacheOnlineUsers(roomId: string, users: ChatUser[]): void {
    this.onlineUsersCache[roomId] = {
      data: [...users],
      timestamp: Date.now(),
      ttl: this.ONLINE_USERS_TTL,
    }
  }

  getCachedOnlineUsers(roomId: string): ChatUser[] | null {
    const cached = this.onlineUsersCache[roomId]
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > cached.ttl
    if (isExpired) {
      delete this.onlineUsersCache[roomId]
      return null
    }

    return [...cached.data]
  }

  // Cache invalidation
  invalidateMessageCache(roomId?: string): void {
    if (roomId) {
      delete this.messageCache[roomId]
    } else {
      this.messageCache = {}
    }
  }

  invalidateUserCache(userId?: string): void {
    if (userId) {
      delete this.userCache[userId]
    } else {
      this.userCache = {}
    }
  }

  invalidateRoomCache(roomId?: string): void {
    if (roomId) {
      delete this.roomCache[roomId]
    } else {
      this.roomCache = {}
    }
  }

  invalidateOnlineUsersCache(roomId?: string): void {
    if (roomId) {
      delete this.onlineUsersCache[roomId]
    } else {
      this.onlineUsersCache = {}
    }
  }

  // Clear all cache
  clearAll(): void {
    this.messageCache = {}
    this.userCache = {}
    this.roomCache = {}
    this.onlineUsersCache = {}
  }

  // Cache statistics
  getCacheStats(): {
    messages: number
    users: number
    rooms: number
    onlineUsers: number
    totalMemoryUsage: number
  } {
    const messageCount = Object.keys(this.messageCache).length
    const userCount = Object.keys(this.userCache).length
    const roomCount = Object.keys(this.roomCache).length
    const onlineUsersCount = Object.keys(this.onlineUsersCache).length

    // Rough memory usage calculation (in bytes)
    const messageMemory = JSON.stringify(this.messageCache).length * 2
    const userMemory = JSON.stringify(this.userCache).length * 2
    const roomMemory = JSON.stringify(this.roomCache).length * 2
    const onlineUsersMemory = JSON.stringify(this.onlineUsersCache).length * 2

    return {
      messages: messageCount,
      users: userCount,
      rooms: roomCount,
      onlineUsers: onlineUsersCount,
      totalMemoryUsage: messageMemory + userMemory + roomMemory + onlineUsersMemory,
    }
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now()

    // Cleanup messages
    Object.keys(this.messageCache).forEach(roomId => {
      const cached = this.messageCache[roomId]
      if (now - cached.lastUpdated > this.MESSAGE_TTL) {
        delete this.messageCache[roomId]
      }
    })

    // Cleanup users
    Object.keys(this.userCache).forEach(userId => {
      const cached = this.userCache[userId]
      if (now - cached.lastUpdated > this.USER_TTL) {
        delete this.userCache[userId]
      }
    })

    // Cleanup rooms
    Object.keys(this.roomCache).forEach(roomId => {
      const cached = this.roomCache[roomId]
      if (now - cached.lastUpdated > this.ROOM_TTL) {
        delete this.roomCache[roomId]
      }
    })

    // Cleanup online users
    Object.keys(this.onlineUsersCache).forEach(roomId => {
      const cached = this.onlineUsersCache[roomId]
      if (now - cached.timestamp > cached.ttl) {
        delete this.onlineUsersCache[roomId]
      }
    })
  }

  // Auto cleanup interval
  startAutoCleanup(intervalMs: number = 60000): () => void {
    const interval = setInterval(() => {
      this.cleanup()
    }, intervalMs)

    return () => clearInterval(interval)
  }
}

// Singleton instance
const chatCache = new ChatCacheManager()

// Start auto cleanup
if (typeof window !== 'undefined') {
  chatCache.startAutoCleanup()
}

export default chatCache
