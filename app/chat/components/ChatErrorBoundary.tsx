'use client'

import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import ErrorFallback from './ErrorFallback'
import { handleChatApiError, type ChatApiError } from '@/lib/api/chat-error-handler'

interface ChatErrorBoundaryState {
  hasError: boolean
  error: ChatApiError | null
  errorInfo: ErrorInfo | null
}

interface ChatErrorBoundaryProps {
  children: ReactNode
  fallback?: React.ComponentType<{
    error: ChatApiError | null
    onRetry: () => void
    onClearError: () => void
  }>
  onError?: (error: ChatApiError, errorInfo: ErrorInfo) => void
}

class ChatErrorBoundary extends Component<ChatErrorBoundaryProps, ChatErrorBoundaryState> {
  // 构造函数初始化状态
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

    return {
      hasError: true,
      error: chatError,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const chatError = handleChatApiError(error, 'React component error', {
      showToast: false,
      logError: true,
    })

    // 仅更新 errorInfo，hasError/error 通过 getDerivedStateFromError 处理
    this.setState({ errorInfo })

    // Call custom error handler if provided
    this.props.onError?.(chatError, errorInfo)
  }

  // 统一的错误重置/清除方法
  resetErrorState = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleRetry = () => {
    this.resetErrorState()
  }

  handleClearError = () => {
    this.resetErrorState()
  }

  render() {
    const { hasError, error } = this.state
    if (hasError) {
      const FallbackComponent = this.props.fallback || ErrorFallback
      return (
        <FallbackComponent
          error={error}
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
        // ChatErrorBoundary: Error in error boundary
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
