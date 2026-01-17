import useAuthStore from '@/stores/authStore'
import type { ChatMessage, ChatState, OnlineUser } from '../../types'

/**
 * 获取当前用户ID
 */
export const getCurrentUserId = (): number | null => {
  return useAuthStore.getState().user?.id || null
}

/**
 * 检查是否为自己的消息
 */
export const isOwnMessage = (message: ChatMessage): boolean => {
  const currentUserId = getCurrentUserId()
  return currentUserId ? message.user.id === currentUserId : false
}

/**
 * 清理房间数据
 */
export const cleanRoomData = (state: ChatState, roomId: number): Partial<ChatState> => {
  const roomKey = roomId.toString()
  const newState: Partial<ChatState> = {}

  // 清理消息数据
  const newMessages = { ...state.messages }
  delete newMessages[roomKey]
  newState.messages = newMessages

  const newOnlineUsers = { ...state.onlineUsers }
  delete newOnlineUsers[roomKey]
  newState.onlineUsers = newOnlineUsers

  const newMessagesPagination = { ...state.messagesPagination }
  delete newMessagesPagination[roomKey]
  newState.messagesPagination = newMessagesPagination

  // 清理通知数据
  const newNotifications = { ...state.notifications }
  delete newNotifications[roomKey]
  newState.notifications = newNotifications
  newState.mentions = state.mentions.filter(mention => mention.roomId !== roomId)

  return newState
}

/**
 * 更新在线用户列表，避免重复
 */
export const addOnlineUserToList = (currentUsers: OnlineUser[], user: OnlineUser): OnlineUser[] => {
  const userExists = currentUsers.some(u => u.id === user.id)
  if (userExists) return currentUsers
  return [...currentUsers, user]
}

/**
 * 从在线用户列表中移除用户
 */
export const removeOnlineUserFromList = (
  currentUsers: OnlineUser[],
  userId: number
): OnlineUser[] => {
  return currentUsers.filter(u => u.id !== userId)
}
