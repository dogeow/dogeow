/**
 * 通知相关状态管理
 */
import { create } from 'zustand'

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

interface NotificationState {
  notifications: Record<string, RoomNotification>
  mentions: MentionInfo[]
  notificationSettings: NotificationSettings
  totalUnreadCount: number
  browserNotificationPermission: NotificationPermission
}

interface NotificationActions {
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
}

export type NotificationStore = NotificationState & NotificationActions

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: {},
  mentions: [],
  notificationSettings: {
    browserNotifications: true,
    soundNotifications: true,
    mentionNotifications: true,
    roomNotifications: true,
  },
  totalUnreadCount: 0,
  browserNotificationPermission: 'default',

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
      !document.hidden
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

      const totalUnreadCount = Object.values(newNotifications).reduce(
        (total, notification) => total + notification.unreadCount,
        0
      )

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
}))
