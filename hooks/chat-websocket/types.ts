import type Echo from 'laravel-echo'
import type { ConnectionStatus, ConnectionMonitor } from '@/lib/websocket'
import type { OfflineState, QueuedMessage } from '@/lib/websocket/offline-manager'
import type { ConnectionError } from '@/lib/websocket/error-handler'

export type SendMessageResult = { success: true } | { success: false; errorMessage?: string }

export interface UseChatWebSocketReturn {
  echo: Echo<'reverb'> | null
  connect: (roomId?: string) => Promise<boolean>
  disconnect: () => void
  joinRoom: (roomId: string, echoInstance?: Echo<'reverb'>) => void
  sendMessage: (roomId: string, message: string) => Promise<SendMessageResult>
  isConnected: boolean
  connectionStatus: ConnectionStatus
  connectionInfo: ConnectionMonitor
  offlineState: OfflineState
  reconnect: () => void
  retryFailedMessages: () => void
  clearOfflineQueue: () => void
}

export interface User {
  id: number
  name: string
  email?: string
  [key: string]: unknown
}

export interface UserPresenceEvent {
  users?: User[]
  user?: User
  action: 'here' | 'joining' | 'leaving'
}

export interface UseChatWebSocketOptions {
  autoConnect?: boolean
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: ConnectionError) => void
  onMessage?: (data: unknown) => void
  onOffline?: () => void
  onOnline?: () => void
  onMessageQueued?: (message: QueuedMessage) => void
  onMessageSent?: (message: QueuedMessage) => void
  onMessageFailed?: (message: QueuedMessage, error: unknown) => void
  onMessageSentSuccess?: (messageData: unknown) => void
  onUserJoined?: (event: UserPresenceEvent) => void
  onUserLeft?: (event: UserPresenceEvent) => void
  authTokenRefreshCallback?: () => Promise<string | null>
}
