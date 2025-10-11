/**
 * 连接状态管理
 */
import { create } from 'zustand'

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

interface ConnectionState {
  isConnected: boolean
  connectionStatus: ConnectionStatus
  isUserMuted: boolean
  muteUntil: string | null
  muteReason: string | null
}

interface ConnectionActions {
  setConnectionStatus: (status: ConnectionStatus) => void
  setConnected: (connected: boolean) => void
  updateMuteStatus: (isMuted: boolean, until?: string, reason?: string) => void
  checkMuteStatus: () => boolean
}

export type ConnectionStore = ConnectionState & ConnectionActions

export const useConnectionStore = create<ConnectionStore>((set, get) => ({
  isConnected: false,
  connectionStatus: 'disconnected',
  isUserMuted: false,
  muteUntil: null,
  muteReason: null,

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

    if (muteUntil) {
      const muteUntilDate = new Date(muteUntil)
      const now = new Date()

      if (muteUntilDate <= now) {
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
}))
