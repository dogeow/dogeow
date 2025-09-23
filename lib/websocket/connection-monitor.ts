import Echo from 'laravel-echo'
import { getEchoInstance } from './echo'
import WebSocketErrorHandler, { ConnectionError } from './error-handler'

export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'error'

export interface ConnectionMonitor {
  status: ConnectionStatus
  lastConnected: Date | null
  reconnectAttempts: number
  maxReconnectAttempts: number
  lastError: ConnectionError | null
  isRetrying: boolean
}

class WebSocketConnectionMonitor {
  private status: ConnectionStatus = 'disconnected'
  private lastConnected: Date | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private lastError: ConnectionError | null = null
  private isRetrying = false
  private listeners: Array<(monitor: ConnectionMonitor) => void> = []
  private reconnectTimeout: NodeJS.Timeout | null = null
  private errorHandler: WebSocketErrorHandler

  constructor() {
    this.errorHandler = new WebSocketErrorHandler({
      onError: error => {
        this.lastError = error
        this.notifyListeners()
      },
      onRetry: (attempt, delay) => {
        this.isRetrying = true
        this.reconnectAttempts = attempt
        this.updateStatus('reconnecting')
        console.log(`WebSocket retry attempt ${attempt} in ${delay}ms`)
      },
      onMaxRetriesReached: () => {
        this.isRetrying = false
        this.updateStatus('error')
        console.error('WebSocket max retry attempts reached')
      },
      retryConfig: {
        maxAttempts: this.maxReconnectAttempts,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        jitter: true,
      },
    })
    this.setupEventListeners()
  }

  private setupEventListeners() {
    // 当 Echo 实例被创建时会调用此方法
  }

  public initializeWithEcho(echo: Echo<'reverb'>) {
    console.log('🔥 ConnectionMonitor: 开始初始化，Echo实例:', !!echo)
    if (echo && echo.connector && echo.connector.pusher) {
      console.log('🔥 ConnectionMonitor: Echo实例有效，开始绑定事件')
      // Pusher 连接事件
      echo.connector.pusher.connection.bind('connected', () => {
        console.log('🔥 ConnectionMonitor: 连接成功事件触发')
        this.updateStatus('connected')
        this.lastConnected = new Date()
        this.reconnectAttempts = 0
        this.lastError = null
        this.isRetrying = false
        this.errorHandler.resetRetryCount()
        this.clearReconnectTimeout()
        console.log('🔥 ConnectionMonitor: 状态已更新为connected')
      })

      echo.connector.pusher.connection.bind('connecting', () => {
        console.log('🔥 ConnectionMonitor: 正在连接事件触发')
        this.updateStatus('connecting')
      })

      echo.connector.pusher.connection.bind('disconnected', () => {
        console.log('🔥 ConnectionMonitor: 连接断开事件触发')
        this.updateStatus('disconnected')
        // 暂时禁用自动重连以避免循环
        // this.scheduleReconnect()
      })

      echo.connector.pusher.connection.bind('error', (error: unknown) => {
        const connectionError = this.errorHandler.handleError(error, 'WebSocket connection')
        this.updateStatus('error')

        if (this.errorHandler.shouldRetry(connectionError)) {
          this.scheduleReconnectWithErrorHandler()
        }
      })

      echo.connector.pusher.connection.bind('unavailable', (error: unknown) => {
        const connectionError = this.errorHandler.handleError(
          error || { message: 'WebSocket unavailable' },
          'WebSocket unavailable'
        )
        this.updateStatus('error')

        if (this.errorHandler.shouldRetry(connectionError)) {
          this.scheduleReconnectWithErrorHandler()
        }
      })

      // 额外的错误事件
      echo.connector.pusher.connection.bind('failed', (error: unknown) => {
        const connectionError = this.errorHandler.handleError(error, 'WebSocket connection failed')
        this.updateStatus('error')

        if (this.errorHandler.shouldRetry(connectionError)) {
          this.scheduleReconnectWithErrorHandler()
        }
      })
    }
  }

  private updateStatus(newStatus: ConnectionStatus) {
    this.status = newStatus
    this.notifyListeners()
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return
    }

    this.clearReconnectTimeout()

    // 指数退避：1秒、2秒、4秒、8秒、16秒
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 16000)

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++
      this.updateStatus('reconnecting')

      const echo = getEchoInstance()
      if (echo) {
        echo.connector.pusher.connect()
      }
    }, delay)
  }

  private scheduleReconnectWithErrorHandler() {
    this.errorHandler.scheduleRetry(() => {
      const echo = getEchoInstance()
      if (echo) {
        echo.connector.pusher.connect()
      }
    })
  }

  private clearReconnectTimeout() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
  }

  private notifyListeners() {
    const monitor: ConnectionMonitor = {
      status: this.status,
      lastConnected: this.lastConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      lastError: this.lastError,
      isRetrying: this.isRetrying,
    }

    this.listeners.forEach(listener => listener(monitor))
  }

  public subscribe(listener: (monitor: ConnectionMonitor) => void): () => void {
    this.listeners.push(listener)

    // 立即通知当前状态
    this.notifyListeners()

    // 返回取消订阅函数
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  public getStatus(): ConnectionMonitor {
    return {
      status: this.status,
      lastConnected: this.lastConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      lastError: this.lastError,
      isRetrying: this.isRetrying,
    }
  }

  public forceReconnect() {
    this.reconnectAttempts = 0
    this.lastError = null
    this.isRetrying = false
    this.errorHandler.resetRetryCount()
    this.clearReconnectTimeout()

    const echo = getEchoInstance()
    if (echo) {
      echo.connector.pusher.disconnect()
      echo.connector.pusher.connect()
    }
  }

  public destroy() {
    this.clearReconnectTimeout()
    this.errorHandler.destroy()
    this.listeners = []
  }
}

// 单例实例
let connectionMonitor: WebSocketConnectionMonitor | null = null

export const getConnectionMonitor = (): WebSocketConnectionMonitor => {
  if (!connectionMonitor) {
    connectionMonitor = new WebSocketConnectionMonitor()
  }
  return connectionMonitor
}

export const destroyConnectionMonitor = (): void => {
  if (connectionMonitor) {
    connectionMonitor.destroy()
    connectionMonitor = null
  }
}
