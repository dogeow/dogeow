// import { ConnectionStatus } from './connection-monitor'

export interface ConnectionError {
  type: 'connection' | 'authentication' | 'network' | 'timeout' | 'unknown'
  message: string
  code?: string | number
  timestamp: Date
  retryable: boolean
}

export interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  jitter: boolean
}

export interface ErrorHandlerOptions {
  onError?: (error: ConnectionError) => void
  onRetry?: (attempt: number, delay: number) => void
  onMaxRetriesReached?: () => void
  retryConfig?: Partial<RetryConfig>
}

class WebSocketErrorHandler {
  private retryConfig: RetryConfig = {
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
  }

  private currentAttempt = 0
  private retryTimeout: NodeJS.Timeout | null = null
  private listeners: Array<(error: ConnectionError) => void> = []

  constructor(private options: ErrorHandlerOptions = {}) {
    if (options.retryConfig) {
      this.retryConfig = { ...this.retryConfig, ...options.retryConfig }
    }
  }

  public handleError(error: unknown, context?: string): ConnectionError {
    const connectionError = this.parseError(error, context)

    // Notify listeners
    this.listeners.forEach(listener => listener(connectionError))

    // Call external error handler
    if (this.options.onError) {
      this.options.onError(connectionError)
    }

    return connectionError
  }

  private parseError(error: unknown, context?: string): ConnectionError {
    let type: ConnectionError['type'] = 'unknown'
    let message = 'An unknown error occurred'
    let code: string | number | undefined
    let retryable = true

    if (typeof error === 'object' && error !== null && 'code' in error) {
      code = (error as { code?: string | number }).code
      // Parse Pusher/WebSocket error codes
      switch (code) {
        case 4000:
          type = 'authentication'
          message = 'Authentication failed'
          retryable = false
          break
        case 4001:
          type = 'authentication'
          message = 'Authentication token expired'
          retryable = true
          break
        case 4004:
          type = 'connection'
          message = 'Connection limit exceeded'
          retryable = false
          break
        case 4100:
          type = 'connection'
          message = 'Connection refused'
          retryable = true
          break
        case 4200:
          type = 'connection'
          message = 'Connection timeout'
          retryable = true
          break
        default:
          if (typeof code === 'number' && code >= 4000 && code < 5000) {
            type = 'connection'
            message =
              typeof error === 'object' &&
              error !== null &&
              'message' in error &&
              typeof (error as { message?: unknown }).message === 'string'
                ? (error as { message: string }).message
                : 'Connection failed'
          }
      }
    } else if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
    ) {
      message = (error as { message: string }).message
      // Parse common error patterns
      if (message.includes('network') || message.includes('Network')) {
        type = 'network'
        retryable = true
      } else if (message.includes('timeout') || message.includes('Timeout')) {
        type = 'timeout'
        retryable = true
      } else if (message.includes('auth') || message.includes('Auth')) {
        type = 'authentication'
        retryable = true
      } else if (message.includes('connect') || message.includes('Connect')) {
        type = 'connection'
        retryable = true
      }
    }

    // Add context to message if provided
    if (context) {
      message = `${context}: ${message}`
    }

    return {
      type,
      message,
      code,
      timestamp: new Date(),
      retryable,
    }
  }

  public shouldRetry(error: ConnectionError): boolean {
    return error.retryable && this.currentAttempt < this.retryConfig.maxAttempts
  }

  public scheduleRetry(callback: () => void): void {
    if (this.currentAttempt >= this.retryConfig.maxAttempts) {
      if (this.options.onMaxRetriesReached) {
        this.options.onMaxRetriesReached()
      }
      return
    }

    this.clearRetryTimeout()

    const delay = this.calculateRetryDelay()
    this.currentAttempt++

    if (this.options.onRetry) {
      this.options.onRetry(this.currentAttempt, delay)
    }

    this.retryTimeout = setTimeout(() => {
      callback()
    }, delay)
  }

  private calculateRetryDelay(): number {
    const baseDelay = this.retryConfig.baseDelay
    const backoffMultiplier = this.retryConfig.backoffMultiplier
    const maxDelay = this.retryConfig.maxDelay

    // Exponential backoff
    let delay = baseDelay * Math.pow(backoffMultiplier, this.currentAttempt - 1)

    // Apply jitter to prevent thundering herd
    if (this.retryConfig.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5)
    }

    // Cap at max delay
    return Math.min(delay, maxDelay)
  }

  public resetRetryCount(): void {
    this.currentAttempt = 0
    this.clearRetryTimeout()
  }

  public clearRetryTimeout(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
      this.retryTimeout = null
    }
  }

  public getCurrentAttempt(): number {
    return this.currentAttempt
  }

  public getMaxAttempts(): number {
    return this.retryConfig.maxAttempts
  }

  public subscribe(listener: (error: ConnectionError) => void): () => void {
    this.listeners.push(listener)

    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  public destroy(): void {
    this.clearRetryTimeout()
    this.listeners = []
  }
}

export default WebSocketErrorHandler
