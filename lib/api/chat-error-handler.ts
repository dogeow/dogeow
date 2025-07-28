import { toast } from 'sonner'
import { reportChatError } from '@/lib/services/errorReportingService'

export interface ChatApiError {
  type: 'network' | 'authentication' | 'validation' | 'server' | 'timeout' | 'unknown'
  message: string
  code?: string | number
  status?: number
  details?: Record<string, unknown>
  timestamp: Date
  retryable: boolean
  userFriendly: boolean
}

export interface ErrorHandlingOptions {
  showToast?: boolean
  logError?: boolean
  reportError?: boolean
  retryable?: boolean
  fallbackMessage?: string
  context?: Record<string, unknown>
  onError?: (error: ChatApiError) => void
}

// Type guards
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasProperty<T extends string>(obj: unknown, prop: T): obj is Record<T, unknown> {
  return isObject(obj) && prop in obj
}

class ChatApiErrorHandler {
  private errorLog: ChatApiError[] = []
  private maxLogSize = 100

  public handleError(
    error: unknown,
    context?: string,
    options: ErrorHandlingOptions = {}
  ): ChatApiError {
    const {
      showToast = true,
      logError = true,
      reportError = true,
      retryable = true,
      fallbackMessage = 'An error occurred',
      onError,
    } = options

    const chatError = this.parseError(error, context, retryable, fallbackMessage)

    // Log error if enabled
    if (logError) {
      this.logError(chatError)
    }

    // Report error if enabled
    if (reportError) {
      reportChatError(chatError, context ? { context } : undefined)
    }

    // Show toast notification if enabled
    if (showToast && chatError.userFriendly) {
      this.showErrorToast(chatError)
    }

    // Call custom error handler if provided
    if (onError) {
      onError(chatError)
    }

    return chatError
  }

  private parseError(
    error: unknown,
    context?: string,
    retryable: boolean = true,
    fallbackMessage: string = 'An error occurred'
  ): ChatApiError {
    let type: ChatApiError['type'] = 'unknown'
    let message = fallbackMessage
    let code: string | number | undefined
    let status: number | undefined
    let details: Record<string, unknown> | undefined
    const userFriendly = true

    // Handle null, undefined, or empty object errors
    if (!error || (typeof error === 'object' && Object.keys(error).length === 0)) {
      type = 'unknown'
      message = context ? `${context}: Unknown error occurred` : 'Unknown error occurred'
      return {
        type,
        message,
        code,
        status,
        details,
        timestamp: new Date(),
        retryable,
        userFriendly,
      }
    }

    // Handle different error types
    if (hasProperty(error, 'response') && isObject(error.response)) {
      // HTTP response error
      status = typeof error.response.status === 'number' ? error.response.status : undefined
      code = status

      switch (status) {
        case 400:
          type = 'validation'
          message = 'Invalid request. Please check your input.'
          break
        case 401:
          type = 'authentication'
          message = 'Authentication required. Please log in again.'
          retryable = false
          break
        case 403:
          type = 'authentication'
          message = 'Access denied. You do not have permission to perform this action.'
          retryable = false
          break
        case 404:
          type = 'validation'
          message = 'The requested resource was not found.'
          retryable = false
          break
        case 422:
          type = 'validation'
          message = 'Validation failed. Please check your input.'
          if (
            hasProperty(error.response, 'data') &&
            isObject(error.response.data) &&
            hasProperty(error.response.data, 'errors')
          ) {
            details = error.response.data.errors as Record<string, unknown>
            // Get first validation error message
            if (details) {
              const firstError = Object.values(details)[0]
              if (Array.isArray(firstError) && firstError.length > 0) {
                message = firstError[0] as string
              }
            }
          }
          retryable = false
          break
        case 429:
          type = 'validation'
          message = 'Too many requests. Please wait a moment before trying again.'
          break
        case 500:
        case 502:
        case 503:
        case 504:
          type = 'server'
          message = 'Server error. Please try again later.'
          break
        default:
          type = 'server'
          message = `Server error (${status}). Please try again later.`
      }

      // Use server-provided message if available
      if (
        hasProperty(error.response, 'data') &&
        isObject(error.response.data) &&
        hasProperty(error.response.data, 'message') &&
        typeof error.response.data.message === 'string'
      ) {
        message = error.response.data.message
      }
    } else if (hasProperty(error, 'request')) {
      // Network error
      type = 'network'
      message = 'Network error. Please check your internet connection.'
    } else if (hasProperty(error, 'code')) {
      // Handle specific error codes
      code =
        typeof error.code === 'string' || typeof error.code === 'number' ? error.code : undefined

      switch (error.code) {
        case 'ECONNABORTED':
        case 'TIMEOUT':
          type = 'timeout'
          message = 'Request timed out. Please try again.'
          break
        case 'NETWORK_ERROR':
          type = 'network'
          message = 'Network error. Please check your internet connection.'
          break
        case 'ENOTFOUND':
          type = 'network'
          message = 'Unable to connect to the server. Please try again later.'
          break
        default:
          type = 'unknown'
          if (error && typeof error === 'object' && 'message' in error) {
            message = (error as { message: string }).message || fallbackMessage
          } else {
            message = fallbackMessage
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
      if (message.includes('fetch')) {
        type = 'network'
        message = 'Network error. Please check your internet connection.'
      } else if (message.includes('timeout')) {
        type = 'timeout'
        message = 'Request timed out. Please try again.'
      } else if (message.includes('auth') || message.includes('token')) {
        type = 'authentication'
        message = 'Authentication error. Please log in again.'
        retryable = false
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
      status,
      details,
      timestamp: new Date(),
      retryable,
      userFriendly,
    }
  }

  private logError(error: ChatApiError): void {
    // Add to error log
    this.errorLog.unshift(error)

    // Maintain log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize)
    }

    // Console logging based on error type
    const logData = {
      type: error.type,
      message: error.message,
      code: error.code,
      status: error.status,
      timestamp: error.timestamp,
      details: error.details,
    }

    switch (error.type) {
      case 'network':
      case 'timeout':
        console.warn('Chat API Network Error:', logData)
        break
      case 'authentication':
        console.warn('Chat API Auth Error:', logData)
        break
      case 'validation':
        console.info('Chat API Validation Error:', logData)
        break
      case 'server':
        console.error('Chat API Server Error:', logData)
        break
      default:
        console.error('Chat API Unknown Error:', logData)
    }
  }

  private showErrorToast(error: ChatApiError): void {
    const toastOptions = {
      duration: 5000,
      action: error.retryable
        ? {
            label: 'Retry',
            onClick: () => {
              // This would be handled by the calling component
              console.log('Retry requested for error:', error.message)
            },
          }
        : undefined,
    }

    switch (error.type) {
      case 'network':
      case 'timeout':
        toast.error(error.message, {
          ...toastOptions,
          description: 'Please check your internet connection and try again.',
        })
        break
      case 'authentication':
        toast.error(error.message, {
          ...toastOptions,
          description: 'You may need to log in again.',
          action: {
            label: 'Login',
            onClick: () => {
              window.location.href = '/login'
            },
          },
        })
        break
      case 'validation':
        toast.warning(error.message, {
          duration: 4000,
        })
        break
      case 'server':
        toast.error(error.message, {
          ...toastOptions,
          description: 'Our servers are experiencing issues. Please try again later.',
        })
        break
      default:
        toast.error(error.message, toastOptions)
    }
  }

  public getErrorLog(): ChatApiError[] {
    return [...this.errorLog]
  }

  public clearErrorLog(): void {
    this.errorLog = []
  }

  public getErrorsByType(type: ChatApiError['type']): ChatApiError[] {
    return this.errorLog.filter(error => error.type === type)
  }

  public getRecentErrors(minutes: number = 5): ChatApiError[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000)
    return this.errorLog.filter(error => error.timestamp > cutoff)
  }

  public hasRecentErrors(type?: ChatApiError['type'], minutes: number = 5): boolean {
    const recentErrors = this.getRecentErrors(minutes)
    return type ? recentErrors.some(error => error.type === type) : recentErrors.length > 0
  }
}

// Singleton instance
const chatApiErrorHandler = new ChatApiErrorHandler()

export default chatApiErrorHandler

// Convenience functions
export const handleChatApiError = (
  error: unknown,
  context?: string,
  options?: ErrorHandlingOptions
): ChatApiError => {
  return chatApiErrorHandler.handleError(error, context, options)
}

export const getChatErrorLog = (): ChatApiError[] => {
  return chatApiErrorHandler.getErrorLog()
}

export const clearChatErrorLog = (): void => {
  chatApiErrorHandler.clearErrorLog()
}

export const hasRecentChatErrors = (type?: ChatApiError['type'], minutes?: number): boolean => {
  return chatApiErrorHandler.hasRecentErrors(type, minutes)
}
