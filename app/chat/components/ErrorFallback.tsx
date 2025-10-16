'use client'

import { AlertCircle, RefreshCw, Wifi, WifiOff, Shield, Server } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { type ChatApiError } from '@/lib/api/chat-error-handler'

/**
 * 错误回退组件属性接口
 */
interface ErrorFallbackProps {
  error: ChatApiError | Error | null
  onRetry?: () => void
  onClearError?: () => void
  className?: string
  variant?: 'full' | 'inline' | 'minimal'
}

/**
 * 根据错误类型获取对应的图标
 */
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

/**
 * 根据错误类型获取对应的颜色样式
 */
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

/**
 * 根据错误类型获取对应的标题
 */
const getErrorTitle = (errorType: ChatApiError['type']) => {
  switch (errorType) {
    case 'network':
      return '连接问题'
    case 'timeout':
      return '请求超时'
    case 'authentication':
      return '需要身份验证'
    case 'server':
      return '服务器错误'
    case 'validation':
      return '无效请求'
    default:
      return '出现错误'
  }
}

/**
 * 根据错误类型获取对应的描述信息
 */
const getErrorDescription = (errorType: ChatApiError['type']) => {
  switch (errorType) {
    case 'network':
      return '无法连接到聊天服务器。请检查您的网络连接。'
    case 'timeout':
      return '请求超时，请稍后重试。'
    case 'authentication':
      return '您需要登录才能访问聊天功能。请重新登录。'
    case 'server':
      return '服务器暂时出现问题，请稍后重试。'
    case 'validation':
      return '请求格式有误，请检查输入内容后重试。'
    default:
      return '发生未知错误，请重试。'
  }
}

/**
 * 根据错误类型和可重试状态生成对应的操作按钮
 */
const getActionButtons = (
  errorType: ChatApiError['type'],
  retryable: boolean,
  onRetry?: () => void,
  onClearError?: () => void
) => {
  const buttons = []

  // 重试按钮
  if (retryable && onRetry) {
    buttons.push(
      <Button key="retry" onClick={onRetry} className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4" />
        重试
      </Button>
    )
  }

  // 登录按钮（认证错误时显示）
  if (errorType === 'authentication') {
    buttons.push(
      <Button
        key="login"
        onClick={() => (window.location.href = '/login')}
        className="flex items-center gap-2"
      >
        <Shield className="h-4 w-4" />
        登录
      </Button>
    )
  }

  // 刷新页面按钮（网络错误时显示）
  if (errorType === 'network') {
    buttons.push(
      <Button
        key="refresh"
        variant="outline"
        onClick={() => window.location.reload()}
        className="flex items-center gap-2"
      >
        <Wifi className="h-4 w-4" />
        刷新页面
      </Button>
    )
  }

  // 关闭错误按钮
  if (onClearError) {
    buttons.push(
      <Button
        key="dismiss"
        variant="ghost"
        onClick={onClearError}
        className="flex items-center gap-2"
      >
        关闭
      </Button>
    )
  }

  return buttons
}

/**
 * 错误回退组件 - 用于显示各种类型的错误信息
 */
export default function ErrorFallback({
  error,
  onRetry,
  onClearError,
  className = '',
  variant = 'full',
}: ErrorFallbackProps) {
  if (!error) return null

  // 解析错误信息
  const chatError = error as ChatApiError
  const errorType = chatError.type || 'unknown'
  const errorMessage = chatError.message || error.message || '发生未知错误'
  const retryable = chatError.retryable !== false
  const timestamp = chatError.timestamp || new Date()

  const icon = getErrorIcon(errorType)
  const colorClass = getErrorColor(errorType)
  const title = getErrorTitle(errorType)
  const description = getErrorDescription(errorType)
  const actionButtons = getActionButtons(errorType, retryable, onRetry, onClearError)

  // 最小化变体 - 仅显示简单的错误消息
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 text-sm text-red-600 ${className}`}>
        <AlertCircle className="h-4 w-4" />
        <span>{errorMessage}</span>
        {retryable && onRetry && (
          <Button size="sm" variant="ghost" onClick={onRetry} className="h-6 px-2">
            重试
          </Button>
        )}
      </div>
    )
  }

  // 内联变体 - 紧凑的错误显示
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

  // 完整变体 - 完整的错误页面
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <Card className={`w-full max-w-md ${colorClass}`}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">{icon}</div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-base">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 错误详情 */}
          <div className="rounded-lg bg-white/50 p-3">
            <p className="text-sm font-medium text-gray-700">错误详情：</p>
            <p className="mt-1 text-sm text-gray-600">{errorMessage}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>类型：{errorType}</span>
              <span>{timestamp.toLocaleTimeString()}</span>
            </div>
            {chatError.code && (
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  错误代码：{chatError.code}
                </Badge>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          {actionButtons.length > 0 && <div className="flex flex-col gap-2">{actionButtons}</div>}

          {/* 额外帮助信息 */}
          <div className="text-center">
            <p className="text-xs text-gray-500">如果问题持续存在，请联系技术支持。</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * 专门用于常见场景的错误回退组件
 */

/**
 * 网络错误回退组件
 */
export function NetworkErrorFallback({
  onRetry,
  className,
}: {
  onRetry?: () => void
  className?: string
}) {
  const error: ChatApiError = {
    name: 'ChatApiError',
    type: 'network',
    message: '无法连接到聊天服务器',
    timestamp: new Date(),
    retryable: true,
    userFriendly: true,
  }

  return <ErrorFallback error={error} onRetry={onRetry} variant="inline" className={className} />
}

/**
 * 认证错误回退组件
 */
export function AuthErrorFallback({ className }: { className?: string }) {
  const error: ChatApiError = {
    name: 'ChatApiError',
    type: 'authentication',
    message: '需要身份验证才能访问聊天功能',
    timestamp: new Date(),
    retryable: false,
    userFriendly: true,
  }

  return <ErrorFallback error={error} variant="full" className={className} />
}

/**
 * 服务器错误回退组件
 */
export function ServerErrorFallback({
  onRetry,
  className,
}: {
  onRetry?: () => void
  className?: string
}) {
  const error: ChatApiError = {
    name: 'ChatApiError',
    type: 'server',
    message: '聊天服务器暂时不可用',
    timestamp: new Date(),
    retryable: true,
    userFriendly: true,
  }

  return <ErrorFallback error={error} onRetry={onRetry} variant="inline" className={className} />
}
