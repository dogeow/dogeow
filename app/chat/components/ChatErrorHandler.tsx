'use client'

import { useCallback, useMemo } from 'react'
import ErrorFallback from './ErrorFallback'
import type { ChatApiError } from '@/lib/api/chat-error-handler'

interface ChatErrorHandlerProps {
  storeError?: ChatApiError | null
  componentError?: ChatApiError | null
  retryLastAction: () => void
  clearError: () => void
  clearComponentError: () => void
  retryAction: (action: () => void) => void
  children: React.ReactNode
}

export default function ChatErrorHandler({
  storeError,
  componentError,
  retryLastAction,
  clearError,
  clearComponentError,
  retryAction,
  children,
}: ChatErrorHandlerProps) {
  // 错误重试与清除
  const handleRetryError = useCallback(() => {
    if (storeError) {
      retryAction(() => retryLastAction())
      clearError()
    }
    if (componentError) {
      clearComponentError()
    }
  }, [storeError, componentError, retryAction, retryLastAction, clearError, clearComponentError])

  const handleClearError = useCallback(() => {
    clearError()
    clearComponentError()
  }, [clearError, clearComponentError])

  // 错误优先级处理
  const currentError = useMemo(() => storeError || componentError, [storeError, componentError])

  // 如果是认证或服务器错误，显示全屏错误页面
  if (currentError && (currentError.type === 'authentication' || currentError.type === 'server')) {
    return (
      <ErrorFallback
        error={currentError}
        onRetry={handleRetryError}
        onClearError={handleClearError}
        variant="full"
      />
    )
  }

  return (
    <>
      {/* Error Banner */}
      {currentError && currentError.type !== 'authentication' && currentError.type !== 'server' && (
        <div className="border-b">
          <ErrorFallback
            error={currentError}
            onRetry={handleRetryError}
            onClearError={handleClearError}
            variant="inline"
            className="m-4"
          />
        </div>
      )}
      {children}
    </>
  )
}
