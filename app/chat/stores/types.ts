/**
 * Chat Store 相关的类型定义
 */

export interface NotificationSettings {
  browserNotifications: boolean
  soundNotifications: boolean
  mentionNotifications: boolean
  roomNotifications: boolean
}

export interface RoomNotification {
  roomId: number
  unreadCount: number
  lastMessageAt: string
  hasMentions: boolean
}

export interface MentionInfo {
  messageId: number
  roomId: number
  mentionedAt: string
  isRead: boolean
}
