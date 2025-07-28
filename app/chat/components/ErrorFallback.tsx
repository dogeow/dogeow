'use client'

import { AlertCircle, RefreshCw, Wifi, WifiOff, Shield, Server } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { type ChatApiError } from '@/lib/api/chat-error-handler'

interface ErrorFallbackProps {
  error: ChatApiError | Error | null
  onRetry?: () => void
  onClearError?: () => void
  className?: string
  variant?: 'full' | 'inline' | 'minimal'
}

const getErrorIcon = (errorType: ChatApiError['type']) => {
  switch (errorType) {
    case 'network':
      return <WifiOff className="h-8 w-8 text-red-500" />
    case 'timeout':
      return <RefreshCw className="h-8 w-8 text-yellow-500" />
    case 'authentication':
      return <Shield className="h-8 w-8 text-orange-500" />
    case 'server':
      return <Server className="h-8 w-8 text-red-500" />
    case 'validation':
      return <AlertCircle className="h-8 w-8 text-blue-500" />
    default:
      return <AlertCircle className="h-8 w-8 text-gray-500" />
  }
}

const getErrorColor = (errorType: ChatApiError['type']) => {
  switch (errorType) {
    case 'network':
      return 'border-red-200 bg-red-50'
    case 'timeout':
      return 'border-yellow-200 bg-yellow-50'
    case 'authentication':
      return 'border-orange-200 bg-orange-50'
    case 'server':
      return 'border-red-200 bg-red-50'
    case 'validation':
      return 'border-blue-200 bg-blue-50'
    default:
      return 'border-gray-200 bg-gray-50'
  }
}

const getErrorTitle = (errorType: ChatApiError['type']) => {
  switch (errorType) {
    case 'network':
      return 'Connection Problem'
    case 'timeout':
      return 'Request Timeout'
    case 'authentication':
      return 'Authentication Required'
    case 'server':
      return 'Server Error'
    case 'validation':
      return 'Invalid Request'
    default:
      return 'Something Went Wrong'
  }
}

const getErrorDescription = (errorType: ChatApiError['type']) => {
  switch (errorType) {
    case 'network':
      return 'Unable to connect to the chat server. Please check your internet connection.'
    case 'timeout':
      return 'The request took too long to complete. Please try again.'
    case 'authentication':
      return 'You need to be logged in to access the chat. Please sign in again.'
    case 'server':
      return 'Our servers are experiencing issues. Please try again in a few moments.'
    case 'validation':
      return 'There was a problem with your request. Please check your input and try again.'
    default:
      return 'An unexpected error occurred. Please try again.'
  }
}

const getActionButtons = (
  errorType: ChatApiError['type'],
  retryable: boolean,
  onRetry?: () => void,
  onClearError?: () => void
) => {
  const buttons = []

  if (retryable && onRetry) {
    buttons.push(
      <Button key="retry" onClick={onRetry} className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4" />
        Try Again
      </Button>
    )
  }

  if (errorType === 'authentication') {
    buttons.push(
      <Button
        key="login"
        onClick={() => (window.location.href = '/login')}
        className="flex items-center gap-2"
      >
        <Shield className="h-4 w-4" />
        Sign In
      </Button>
    )
  }

  if (errorType === 'network') {
    buttons.push(
      <Button
        key="refresh"
        variant="outline"
        onClick={() => window.location.reload()}
        className="flex items-center gap-2"
      >
        <Wifi className="h-4 w-4" />
        Refresh Page
      </Button>
    )
  }

  if (onClearError) {
    buttons.push(
      <Button
        key="dismiss"
        variant="ghost"
        onClick={onClearError}
        className="flex items-center gap-2"
      >
        Dismiss
      </Button>
    )
  }

  return buttons
}

export default function ErrorFallback({
  error,
  onRetry,
  onClearError,
  className = '',
  variant = 'full',
}: ErrorFallbackProps) {
  if (!error) return null

  // Parse error
  const chatError = error as ChatApiError
  const errorType = chatError.type || 'unknown'
  const errorMessage = chatError.message || error.message || 'An unknown error occurred'
  const retryable = chatError.retryable !== false
  const timestamp = chatError.timestamp || new Date()

  const icon = getErrorIcon(errorType)
  const colorClass = getErrorColor(errorType)
  const title = getErrorTitle(errorType)
  const description = getErrorDescription(errorType)
  const actionButtons = getActionButtons(errorType, retryable, onRetry, onClearError)

  // Minimal variant - just a small error message
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 text-sm text-red-600 ${className}`}>
        <AlertCircle className="h-4 w-4" />
        <span>{errorMessage}</span>
        {retryable && onRetry && (
          <Button size="sm" variant="ghost" onClick={onRetry} className="h-6 px-2">
            Retry
          </Button>
        )}
      </div>
    )
  }

  // Inline variant - compact error display
  if (variant === 'inline') {
    return (
      <div className={`rounded-lg border p-4 ${colorClass} ${className}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">{icon}</div>
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-gray-900">{title}</h4>
            <p className="mt-1 text-sm text-gray-600">{errorMessage}</p>
            {actionButtons.length > 0 && <div className="mt-3 flex gap-2">{actionButtons}</div>}
          </div>
        </div>
      </div>
    )
  }

  // Full variant - complete error page
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <Card className={`w-full max-w-md ${colorClass}`}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">{icon}</div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-base">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error Details */}
          <div className="rounded-lg bg-white/50 p-3">
            <p className="text-sm font-medium text-gray-700">Error Details:</p>
            <p className="mt-1 text-sm text-gray-600">{errorMessage}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>Type: {errorType}</span>
              <span>{timestamp.toLocaleTimeString()}</span>
            </div>
            {chatError.code && (
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  Code: {chatError.code}
                </Badge>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {actionButtons.length > 0 && <div className="flex flex-col gap-2">{actionButtons}</div>}

          {/* Additional Help */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              If this problem persists, please contact support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Specialized error fallbacks for common scenarios
export function NetworkErrorFallback({
  onRetry,
  className,
}: {
  onRetry?: () => void
  className?: string
}) {
  const error: ChatApiError = {
    type: 'network',
    message: 'Unable to connect to the chat server',
    timestamp: new Date(),
    retryable: true,
    userFriendly: true,
  }

  return <ErrorFallback error={error} onRetry={onRetry} variant="inline" className={className} />
}

export function AuthErrorFallback({ className }: { className?: string }) {
  const error: ChatApiError = {
    type: 'authentication',
    message: 'Authentication required to access chat',
    timestamp: new Date(),
    retryable: false,
    userFriendly: true,
  }

  return <ErrorFallback error={error} variant="full" className={className} />
}

export function ServerErrorFallback({
  onRetry,
  className,
}: {
  onRetry?: () => void
  className?: string
}) {
  const error: ChatApiError = {
    type: 'server',
    message: 'Chat server is temporarily unavailable',
    timestamp: new Date(),
    retryable: true,
    userFriendly: true,
  }

  return <ErrorFallback error={error} onRetry={onRetry} variant="inline" className={className} />
}
