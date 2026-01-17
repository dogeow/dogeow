import type { RoomNotification, MentionInfo } from '../types'

/**
 * 计算总未读数
 */
export const calculateTotalUnreadCount = (
  notifications: Record<string, RoomNotification>
): number => {
  return Object.values(notifications).reduce(
    (total, notification) => total + notification.unreadCount,
    0
  )
}

/**
 * 创建或更新房间通知
 */
export const createOrUpdateRoomNotification = (
  notifications: Record<string, RoomNotification>,
  roomId: number,
  updates: Partial<RoomNotification>
): Record<string, RoomNotification> => {
  const roomKey = roomId.toString()
  const currentNotification = notifications[roomKey] || {
    roomId,
    unreadCount: 0,
    lastMessageAt: new Date().toISOString(),
    hasMentions: false,
  }

  return {
    ...notifications,
    [roomKey]: {
      ...currentNotification,
      ...updates,
    },
  }
}

/**
 * 增加房间未读数
 */
export const incrementRoomUnreadCount = (
  notifications: Record<string, RoomNotification>,
  roomId: number
): Record<string, RoomNotification> => {
  return createOrUpdateRoomNotification(notifications, roomId, {
    unreadCount: (notifications[roomId.toString()]?.unreadCount || 0) + 1,
    lastMessageAt: new Date().toISOString(),
  })
}

/**
 * 检查是否有未读提及
 */
export const hasUnreadMentions = (mentions: MentionInfo[], roomId?: number): boolean => {
  if (roomId) {
    return mentions.some(mention => mention.roomId === roomId && !mention.isRead)
  }
  return mentions.some(mention => !mention.isRead)
}

/**
 * 标记提及为已读
 */
export const markMentionAsRead = (mentions: MentionInfo[], messageId: number): MentionInfo[] => {
  return mentions.map(mention =>
    mention.messageId === messageId ? { ...mention, isRead: true } : mention
  )
}

/**
 * 检查消息中是否包含提及
 */
export const extractMentions = (message: string): string[] => {
  const mentionRegex = /@\w+/g
  return message.match(mentionRegex) || []
}
