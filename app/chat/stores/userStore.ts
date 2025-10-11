/**
 * 用户和在线状态管理
 */
import { create } from 'zustand'
import type { OnlineUser } from '../types'
import { get as apiGet } from '@/lib/api'
import { handleChatApiError } from '@/lib/api/chat-error-handler'

interface UserState {
  onlineUsers: Record<string, OnlineUser[]>
  isLoading: boolean
  error: Error | null
}

interface UserActions {
  updateOnlineUsers: (roomId: number, users: OnlineUser[]) => void
  addOnlineUser: (roomId: number, user: OnlineUser) => void
  removeOnlineUser: (roomId: number, userId: number) => void
  loadOnlineUsers: (roomId: number) => Promise<void>
  clearAllOnlineUsers: () => void
}

export type UserStore = UserState & UserActions

export const useUserStore = create<UserStore>(set => ({
  onlineUsers: {},
  isLoading: false,
  error: null,

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
      const chatError = handleChatApiError(error, '加载在线用户失败', {
        showToast: false,
        retryable: true,
      })
      set({ error: chatError })
    }
  },

  clearAllOnlineUsers: () => {
    set({ onlineUsers: {} })
  },
}))
