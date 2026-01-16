import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import Echo from 'laravel-echo'
import {
  createEchoInstance,
  destroyEchoInstance,
  cancelDestroyEchoInstance,
  getConnectionMonitor,
  getAuthManager,
  type ConnectionStatus,
  type ConnectionMonitor,
} from '@/lib/websocket'
import useChatStore from '@/app/chat/chatStore'
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
    // onUserJoined,  // Currently unused
    // onUserLeft,    // Currently unused
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

    // 初始化连接监控器与Echo实例
    if (echo) {
      monitor.initializeWithEcho(echo)
    }

    connectionMonitorUnsubscribeRef.current = monitor.subscribe(info => {
      console.log('WebSocket: Connection status updated:', info.status)
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
  }, [onConnect, onDisconnect, onError, echo])

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

  // 组件挂载和卸载管理
  useEffect(() => {
    // 组件挂载时，设置为已挂载状态并取消任何待销毁的操作
    isComponentMountedRef.current = true
    cancelDestroyEchoInstance()
    console.log('🔥 WebSocket: Component mounted, cancelled any pending cleanup')

    return () => {
      console.log('🔥 WebSocket: Component cleanup triggered')
      isComponentMountedRef.current = false

      // 清理频道监听
      try {
        if (channelRef.current && typeof channelRef.current.stopListening === 'function') {
          channelRef.current.stopListening()
        }
      } catch (error) {
        console.error('WebSocket: Error during channel cleanup:', error)
      }
      channelRef.current = null
      currentRoomRef.current = null

      // 使用延迟销毁机制
      setEcho(null)
      destroyEchoInstance(false) // 延迟销毁，不立即销毁
    }
  }, []) // 移除依赖项，只在组件卸载时执行

  const connect = useCallback(async (): Promise<boolean> => {
    if (!isComponentMountedRef.current) {
      console.log('🔥 WebSocket: Component unmounted, skipping connect')
      return false
    }

    // 检查是否已有连接
    if (echo) {
      console.log('🔥 WebSocket: Echo instance already exists, checking connection state')
      try {
        if (echo.connector && 'pusher' in echo.connector) {
          const connector = echo.connector as { pusher?: { connection?: { state?: string } } }
          const state = connector.pusher?.connection?.state
          console.log('🔥 WebSocket: Current connection state:', state)
          if (state === 'connected' || state === 'connecting') {
            console.log('🔥 WebSocket: Reusing existing connection')
            return true
          }
        }
      } catch (error) {
        console.warn('🔥 WebSocket: Error checking existing connection:', error)
      }
    }

    try {
      console.log('🔥 WebSocket: Starting connection process')
      const authManager = getAuthManager()
      let token = authManager.getToken()
      if (!token && authTokenRefreshCallback) {
        console.log('🔥 WebSocket: Refreshing auth token')
        token = await authTokenRefreshCallback()
      }
      if (!token) {
        console.error('🔥 WebSocket: No auth token available')
        onError?.({
          type: 'connection',
          message: 'No authentication token available',
          timestamp: new Date(),
          retryable: false,
        })
        return false
      }

      console.log('🔥 WebSocket: Creating Echo instance')
      const echoInstance = createEchoInstance()
      if (!echoInstance) {
        console.error('🔥 WebSocket: Failed to create Echo instance')
        onError?.({
          type: 'connection',
          message: 'Failed to create WebSocket connection',
          timestamp: new Date(),
          retryable: true,
        })
        return false
      }

      console.log('🔥 WebSocket: Echo instance created successfully')

      // 先初始化连接监控器，再设置Echo实例
      const monitor = getConnectionMonitor()
      monitor.initializeWithEcho(echoInstance)
      console.log('🔥 WebSocket: Connection monitor initialized')

      setEcho(echoInstance)
      console.log('🔥 WebSocket: Echo instance set in state')

      // 立即返回true，让连接状态通过事件监听器异步更新
      console.log(
        '🔥 WebSocket: Echo instance ready, connection will be established asynchronously'
      )
      return true
    } catch (error) {
      console.error('🔥 WebSocket: Connection failed:', error)
      onError?.({
        type: 'connection',
        message: error instanceof Error ? error.message : 'Failed to connect to WebSocket',
        timestamp: new Date(),
        retryable: true,
      })
      return false
    }
  }, [authTokenRefreshCallback, onError, echo])

  const disconnect = useCallback(async () => {
    if (!isComponentMountedRef.current) {
      console.log('WebSocket: Component unmounted, skipping disconnect')
      return
    }

    // 如果有当前房间，先主动离开房间
    if (currentRoomRef.current) {
      try {
        console.log('WebSocket: Leaving room before disconnect:', currentRoomRef.current)
        // 调用 API 离开房间
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/chat/rooms/${currentRoomRef.current}/leave`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${getAuthManager().getToken()}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (response.ok) {
          console.log('WebSocket: Successfully left room via API')
        } else {
          console.warn('WebSocket: Failed to leave room via API:', response.status)
        }
      } catch (error) {
        console.error('WebSocket: Error leaving room via API:', error)
      }
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

      console.log('WebSocket: Attempting to join room:', roomId)

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
        // 创建普通频道用于消息
        const channel = echoToUse.channel(`chat.room.${roomId}`)
        console.log('WebSocket: Created channel for room', roomId, 'channel:', channel)

        if (!channel) {
          console.error('WebSocket: Failed to create channel for room', roomId)
          return
        }

        // 临时禁用presence频道，因为需要认证
        console.log('🔥 WebSocket: 暂时跳过presence频道创建（认证问题）')
        // 使用普通频道代替presence频道
        const presenceChannel = echoToUse.channel(`chat.room.${roomId}.users`)
        console.log('🔥 WebSocket: ✅ 用户状态频道创建成功（使用普通频道）')

        // 合并两个频道到一个对象中
        channelRef.current = {
          listen: (event: string, callback: (data: unknown) => void) => {
            try {
              // 消息事件通过普通频道监听
              if (event.includes('message') || event.includes('MessageSent') || event === '.') {
                channel.listen(event, callback)
              } else {
                // 用户事件通过presence频道监听
                presenceChannel.listen(event, callback)
              }
            } catch (error) {
              console.error('WebSocket: Error listening to event', event, ':', error)
            }
          },
          bind: (event: string, callback: (data?: unknown) => void) => {
            try {
              // Laravel Echo没有bind方法，使用listen代替
              channel.listen(event, callback)
              presenceChannel.listen(event, callback)
            } catch (error) {
              console.error('WebSocket: Error binding to event', event, ':', error)
            }
          },
          stopListening: (event?: string, callback?: () => void) => {
            try {
              if (event && callback) {
                channel.stopListening(event, callback)
                presenceChannel.stopListening(event, callback)
              } else if (event) {
                // Laravel Echo的stopListening要求至少一个参数
                console.log('WebSocket: Cannot stop listening without callback, event:', event)
              } else {
                // 停止所有监听 - Laravel Echo需要传入空字符串和空函数
                try {
                  channel.stopListening('*', () => {})
                  presenceChannel.stopListening('*', () => {})
                } catch {
                  // 如果上面的方法不行，尝试其他方法
                  console.warn('WebSocket: Using alternative cleanup method')
                }
              }
            } catch (error) {
              console.error('WebSocket: Error stopping channels:', error)
            }
          },
          // 如果需要访问原始频道的其他方法
          channel,
          presenceChannel,
        } as unknown as {
          listen: (event: string, callback: (data: unknown) => void) => void
          bind: (event: string, callback: (data?: unknown) => void) => void
          stopListening: (event?: string, callback?: () => void) => void
          channel: ReturnType<Echo<'reverb'>['channel']>
          presenceChannel: ReturnType<Echo<'reverb'>['channel']>
        }
      } catch (error) {
        console.error('WebSocket: Error creating channel for room', roomId, ':', error)
        return
      }

      // 消息事件监听
      const safeOnMessage = (data: unknown, type: string = 'message') => {
        if (onMessage && data) onMessage({ type, ...data })
      }

      // 检查频道是否正确初始化
      if (channelRef.current && typeof channelRef.current.listen === 'function') {
        console.log('🔥 WebSocket: Setting up event listeners for room', roomId)

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

        // 绑定系统事件
        if (typeof channelRef.current.bind === 'function') {
          channelRef.current.bind('pusher:subscription_succeeded', () => {
            console.log('🔥 WebSocket: Subscription succeeded for room', roomId)
          })
          channelRef.current.bind('pusher:subscription_error', () => {
            console.error('🔥 WebSocket: Subscription error for room', roomId)
          })
        }
      } else {
        console.error('🔥 WebSocket: Channel reference is invalid - missing listen method')
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
          const errorPayload = await response
            .clone()
            .json()
            .catch(() => null)
          const errorMessage =
            typeof errorPayload?.message === 'string' ? errorPayload.message : response.statusText

          if (response.status === 403) {
            const normalized = errorMessage.toLowerCase()
            if (normalized.includes('mute')) {
              const match = errorMessage.match(/until\s+([0-9:\-\s]+)/i)
              const mutedUntil = match?.[1]?.trim()
              useChatStore.getState().updateMuteStatus(true, mutedUntil, errorMessage || 'Muted')
              return false
            }

            const newToken = await authManager.refreshToken()
            if (newToken) return sendMessage(roomId, message)
            throw new Error('Authentication failed - token expired and refresh failed')
          }

          throw new Error(errorMessage || `Failed to send message: ${response.statusText}`)
        }

        const responseData = await response.json()
        onMessageSentSuccess?.(responseData.data)
        return true
      } catch (error) {
        const errorText = error instanceof Error ? error.message : ''
        if (!errorText.toLowerCase().includes('mute')) {
          offlineManagerRef.current?.queueMessage(roomId, message)
        }
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
