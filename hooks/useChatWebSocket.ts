import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import Echo from 'laravel-echo'
import {
  createEchoInstance,
  destroyEchoInstance,
  getConnectionMonitor,
  getAuthManager,
  type ConnectionStatus,
  type ConnectionMonitor,
} from '@/lib/websocket'
import OfflineManager, {
  type OfflineState,
  type QueuedMessage,
} from '@/lib/websocket/offline-manager'
import { type ConnectionError } from '@/lib/websocket/error-handler'

export interface UseChatWebSocketReturn {
  echo: Echo<'reverb'> | null
  connect: (roomId?: string) => Promise<boolean>
  disconnect: () => void
  joinRoom: (roomId: string, echoInstance?: Echo<'reverb'>) => void
  sendMessage: (roomId: string, message: string) => Promise<boolean>
  isConnected: boolean
  connectionStatus: ConnectionStatus
  connectionInfo: ConnectionMonitor
  offlineState: OfflineState
  reconnect: () => void
  retryFailedMessages: () => void
  clearOfflineQueue: () => void
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
  authTokenRefreshCallback?: () => Promise<string | null>
}

export const useChatWebSocket = (options: UseChatWebSocketOptions = {}): UseChatWebSocketReturn => {
  const {
    autoConnect = false,
    onConnect,
    onDisconnect,
    onError,
    onMessage,
    onOffline,
    onOnline,
    onMessageQueued,
    onMessageSent,
    onMessageFailed,
    onMessageSentSuccess,
    authTokenRefreshCallback,
  } = options

  const [echo, setEcho] = useState<Echo<'reverb'> | null>(null)
  const [connectionInfo, setConnectionInfo] = useState<ConnectionMonitor>({
    status: 'disconnected',
    lastConnected: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    lastError: null,
    isRetrying: false,
  })
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOffline: false,
    lastOnline: null,
    queuedMessages: [],
    queueSize: 0,
    maxQueueSize: 100,
  })

  const currentRoomRef = useRef<string | null>(null)
  const channelRef = useRef<{
    stopListening: (event?: string, callback?: () => void) => void
    listen: (event: string, callback: (data: unknown) => void) => void
    bind?: (event: string, callback: () => void) => void
  } | null>(null)
  const isComponentMountedRef = useRef(true)
  const connectionMonitorUnsubscribeRef = useRef<(() => void) | null>(null)
  const offlineManagerUnsubscribeRef = useRef<(() => void) | null>(null)
  const offlineManagerRef = useRef<OfflineManager | null>(null)

  // 设置 AuthManager 的刷新回调
  useEffect(() => {
    if (authTokenRefreshCallback) {
      getAuthManager().setRefreshCallback(authTokenRefreshCallback)
    }
  }, [authTokenRefreshCallback])

  // 初始化离线管理器
  useEffect(() => {
    const offlineManager = new OfflineManager({
      onOffline,
      onOnline,
      onMessageQueued,
      onMessageSent,
      onMessageFailed,
      onQueueFull: () => {
        console.warn('WebSocket: Offline message queue is full, removing oldest messages')
      },
    })
    offlineManagerRef.current = offlineManager

    offlineManagerUnsubscribeRef.current = offlineManager.subscribe(newState => {
      setOfflineState(prevState =>
        prevState.isOffline !== newState.isOffline ||
        prevState.queueSize !== newState.queueSize ||
        prevState.lastOnline !== newState.lastOnline ||
        prevState.queuedMessages.length !== newState.queuedMessages.length
          ? newState
          : prevState
      )
    })

    return () => {
      offlineManagerUnsubscribeRef.current?.()
      offlineManager.destroy()
      offlineManagerRef.current = null
    }
  }, [onOffline, onOnline, onMessageQueued, onMessageSent, onMessageFailed])

  // 连接状态监控
  useEffect(() => {
    const monitor = getConnectionMonitor()
    connectionMonitorUnsubscribeRef.current = monitor.subscribe(info => {
      setConnectionInfo(prevInfo =>
        prevInfo.status !== info.status ||
        prevInfo.reconnectAttempts !== info.reconnectAttempts ||
        prevInfo.isRetrying !== info.isRetrying ||
        prevInfo.lastConnected !== info.lastConnected ||
        prevInfo.lastError !== info.lastError
          ? info
          : prevInfo
      )

      if (info.status === 'connected') {
        onConnect?.()
        offlineManagerRef.current?.processQueuedMessages()
      } else if (info.status === 'disconnected') {
        onDisconnect?.()
      } else if (info.status === 'error' && info.lastError) {
        onError?.(info.lastError)
      }
    })

    return () => {
      connectionMonitorUnsubscribeRef.current?.()
    }
  }, [onConnect, onDisconnect, onError])

  // 自动连接
  useEffect(() => {
    if (autoConnect) {
      const authManager = getAuthManager()
      const token = authManager.getToken()
      if (token) {
        const echoInstance = createEchoInstance()
        setEcho(echoInstance)
      }
    }
  }, [autoConnect])

  // 组件卸载清理
  useEffect(() => {
    let shouldCleanup = true
    return () => {
      isComponentMountedRef.current = false
      setTimeout(() => {
        if (shouldCleanup && (echo || connectionInfo.status === 'connected')) {
          // 直接清理，避免循环依赖
          try {
            if (channelRef.current && typeof channelRef.current.stopListening === 'function') {
              channelRef.current.stopListening()
            }
          } catch (error) {
            console.error('WebSocket: Error during cleanup:', error)
          }
          channelRef.current = null
          currentRoomRef.current = null
          setEcho(null)
          destroyEchoInstance()
        }
      }, 50)
      setTimeout(() => {
        shouldCleanup = false
      }, 100)
    }
  }, [echo, connectionInfo.status])

  const connect = useCallback(async (): Promise<boolean> => {
    try {
      const authManager = getAuthManager()
      let token = authManager.getToken()
      if (!token && authTokenRefreshCallback) {
        token = await authTokenRefreshCallback()
      }
      if (!token) return false
      const echoInstance = createEchoInstance()
      setEcho(echoInstance)
      return true
    } catch (error) {
      onError?.({
        type: 'connection',
        message: error instanceof Error ? error.message : 'Failed to connect to WebSocket',
        timestamp: new Date(),
        retryable: true,
      })
      return false
    }
  }, [authTokenRefreshCallback, onError])

  const disconnect = useCallback(() => {
    if (!isComponentMountedRef.current) {
      console.log('WebSocket: Component unmounted, skipping disconnect')
      return
    }

    try {
      if (channelRef.current && typeof channelRef.current.stopListening === 'function') {
        console.log('WebSocket: Disconnecting and stopping listening')
        channelRef.current.stopListening()
      }
    } catch (error) {
      console.error('WebSocket: Error during disconnect:', error)
    }
    channelRef.current = null
    currentRoomRef.current = null
    setEcho(null)
    destroyEchoInstance()
  }, [])

  const joinRoom = useCallback(
    async (roomId: string, echoInstance?: Echo<'reverb'>) => {
      if (!isComponentMountedRef.current) {
        console.log('WebSocket: Component unmounted, skipping joinRoom')
        return
      }

      let echoToUse = echoInstance || echo
      if (!echoToUse) {
        const { getEchoInstance } = await import('@/lib/websocket/echo')
        echoToUse = getEchoInstance()
        if (!echoToUse) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          echoToUse = getEchoInstance()
          if (!echoToUse) return
        }
      }
      if (channelRef.current && currentRoomRef.current !== roomId) {
        try {
          if (typeof channelRef.current.stopListening === 'function') {
            console.log('WebSocket: Stopping listening for room', currentRoomRef.current)
            channelRef.current.stopListening()
          } else {
            console.warn('WebSocket: stopListening method not available on channel')
          }
        } catch (error) {
          console.error('WebSocket: Error stopping listening:', error)
        }
      }
      currentRoomRef.current = roomId
      if (!echoToUse) return

      try {
        const channel = echoToUse.channel(`chat.room.${roomId}`)
        console.log('WebSocket: Created channel for room', roomId, 'channel:', channel)

        if (!channel) {
          console.error('WebSocket: Failed to create channel for room', roomId)
          return
        }

        channelRef.current = channel as unknown as {
          stopListening: (event?: string, callback?: () => void) => void
          listen: (event: string, callback: (data: unknown) => void) => void
          bind?: (event: string, callback: () => void) => void
        }
      } catch (error) {
        console.error('WebSocket: Error creating channel for room', roomId, ':', error)
        return
      }

      // 消息事件监听
      const safeOnMessage = (data: unknown, type: string = 'message') => {
        if (onMessage && data) onMessage({ type, ...data })
      }
      if (channelRef.current) {
        channelRef.current.listen('.message.sent', (data: unknown) => {
          const typedData = data as { message?: unknown }
          if (typedData?.message) safeOnMessage({ message: typedData.message }, 'message')
        })
        channelRef.current.listen('user.joined', (data: unknown) =>
          safeOnMessage(data, 'user_joined')
        )
        channelRef.current.listen('user.left', (data: unknown) => safeOnMessage(data, 'user_left'))
        channelRef.current.listen('Chat\\MessageSent', (data: unknown) => {
          const typedData = data as { message?: unknown }
          if (typedData?.message) safeOnMessage({ message: typedData.message }, 'message')
        })
        channelRef.current.listen('.', (data: unknown) => {
          const typedData = data as { message?: unknown }
          if (typedData?.message) {
            safeOnMessage({ message: typedData.message }, 'message')
          }
        })
      }
      if (channelRef.current?.bind) {
        channelRef.current.bind('pusher:subscription_succeeded', () => {})
        channelRef.current.bind('pusher:subscription_error', () => {})
      }
    },
    [echo, onMessage]
  )

  const sendMessage = useCallback(
    async (roomId: string, message: string): Promise<boolean> => {
      if (offlineState.isOffline || connectionInfo.status !== 'connected') {
        offlineManagerRef.current?.queueMessage(roomId, message)
        return !!offlineManagerRef.current
      }
      let echoToUse = echo
      if (!echoToUse) {
        const { getEchoInstance } = await import('@/lib/websocket/echo')
        echoToUse = getEchoInstance()
        if (!echoToUse) {
          offlineManagerRef.current?.queueMessage(roomId, message)
          return !!offlineManagerRef.current
        }
      }
      try {
        const authManager = getAuthManager()
        const token = authManager.getToken()
        if (!token) {
          offlineManagerRef.current?.queueMessage(roomId, message)
          return !!offlineManagerRef.current
        }
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/chat/rooms/${roomId}/messages`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ message }),
          }
        )
        if (!response.ok) {
          if (response.status === 403) {
            const newToken = await authManager.refreshToken()
            if (newToken) return sendMessage(roomId, message)
            throw new Error('Authentication failed - token expired and refresh failed')
          }
          throw new Error(`Failed to send message: ${response.statusText}`)
        }
        const responseData = await response.json()
        onMessageSentSuccess?.(responseData.data)
        return true
      } catch (error) {
        offlineManagerRef.current?.queueMessage(roomId, message)
        onError?.({
          type: 'network',
          message: error instanceof Error ? error.message : 'Failed to send message',
          timestamp: new Date(),
          retryable: true,
        })
        return false
      }
    },
    [echo, offlineState.isOffline, connectionInfo.status, onError, onMessageSentSuccess]
  )

  const reconnect = useCallback(() => {
    getConnectionMonitor().forceReconnect()
  }, [])

  const retryFailedMessages = useCallback(() => {
    offlineManagerRef.current?.retryFailedMessages()
  }, [])

  const clearOfflineQueue = useCallback(() => {
    offlineManagerRef.current?.clearQueue()
  }, [])

  return useMemo(
    () => ({
      echo,
      connect,
      disconnect,
      joinRoom,
      sendMessage,
      isConnected: connectionInfo.status === 'connected',
      connectionStatus: connectionInfo.status,
      connectionInfo,
      offlineState,
      reconnect,
      retryFailedMessages,
      clearOfflineQueue,
    }),
    [
      echo,
      connect,
      disconnect,
      joinRoom,
      sendMessage,
      connectionInfo,
      offlineState,
      reconnect,
      retryFailedMessages,
      clearOfflineQueue,
    ]
  )
}
