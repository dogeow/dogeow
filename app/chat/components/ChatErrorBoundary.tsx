'use client'

import React from 'react'
import ErrorFallback from './ErrorFallback'
import { handleChatApiError, type ChatApiError } from '@/lib/api/chat-error-handler'

interface ChatErrorBoundaryState {
  hasError: boolean
  error: ChatApiError | null
  errorInfo: React.ErrorInfo | null
}

interface ChatErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{
    error: ChatApiError | null
    onRetry: () => void
    onClearError: () => void
  }>
  onError?: (error: ChatApiError, errorInfo: React.ErrorInfo) => void
}

class ChatErrorBoundary extends React.Component<ChatErrorBoundaryProps, ChatErrorBoundaryState> {
  constructor(props: ChatErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ChatErrorBoundaryState> {
    // Convert the error to a ChatApiError
    const chatError = handleChatApiError(error, 'React component error', {
      showToast: false, // Don't show toast here, let the fallback handle it
      logError: true,
    })

    // 添加额外的调试信息
    if (process.env.NODE_ENV === 'development') {
      console.group('ChatErrorBoundary: Component Error')
      console.error('Original error:', error)
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      console.error('Converted ChatApiError:', chatError)
      console.groupEnd()
    }

    return {
      hasError: true,
      error: chatError,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const chatError = handleChatApiError(error, 'React component error', {
      showToast: false,
      logError: true,
    })

    this.setState({
      errorInfo,
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(chatError, errorInfo)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ChatErrorBoundary caught an error:', error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleClearError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || ErrorFallback

      return (
        <FallbackComponent
          error={this.state.error}
          onRetry={this.handleRetry}
          onClearError={this.handleClearError}
        />
      )
    }

    return this.props.children
  }
}

export default ChatErrorBoundary

// Hook for handling errors in functional components
export function useChatErrorHandler() {
  const [error, setError] = React.useState<ChatApiError | null>(null)

  const handleError = React.useCallback((error: Error | ChatApiError, context?: string) => {
    const chatError = handleChatApiError(error, context, {
      showToast: true,
      logError: true,
    })
    setError(chatError)
    return chatError
  }, [])

  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  const retryAction = React.useCallback(
    (action: () => Promise<void> | void) => {
      setError(null)
      try {
        const result = action()
        if (result instanceof Promise) {
          result.catch(handleError)
        }
      } catch (err) {
        console.error('ChatErrorBoundary: Error in error boundary:', err)
        handleError(err as Error)
      }
    },
    [handleError]
  )

  return {
    error,
    handleError,
    clearError,
    retryAction,
    hasError: error !== null,
  }
}
