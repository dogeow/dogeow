'use client'

import { useState, useMemo } from 'react'
import { AlertCircle, Wifi, WifiOff, RefreshCw, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { type ConnectionMonitor, type ConnectionStatus } from '@/lib/websocket/connection-monitor'
import { type OfflineState } from '@/lib/websocket/offline-manager'
import { useTranslation } from '@/hooks/useTranslation'

interface ConnectionStatusIndicatorProps {
  connectionInfo: ConnectionMonitor
  offlineState: OfflineState
  onReconnect: () => void
  onRetryMessages: () => void
  onClearQueue: () => void
  className?: string
}

const getStatusColor = (status: ConnectionStatus): string => {
  switch (status) {
    case 'connected':
      return 'bg-green-500'
    case 'connecting':
    case 'reconnecting':
      return 'bg-yellow-500'
    case 'disconnected':
      return 'bg-gray-500'
    case 'error':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

const getStatusIcon = (status: ConnectionStatus, isRetrying: boolean) => {
  if (isRetrying) {
    return <RefreshCw className="h-4 w-4 animate-spin" />
  }

  switch (status) {
    case 'connected':
      return <Wifi className="h-4 w-4" />
    case 'connecting':
    case 'reconnecting':
      return <RefreshCw className="h-4 w-4 animate-spin" />
    case 'disconnected':
      return <WifiOff className="h-4 w-4" />
    case 'error':
      return <AlertCircle className="h-4 w-4" />
    default:
      return <WifiOff className="h-4 w-4" />
  }
}

const getStatusText = (
  status: ConnectionStatus,
  isRetrying: boolean,
  reconnectAttempts: number,
  t: (key: string, fallback?: string) => string
): string => {
  if (isRetrying) {
    return t('chat.retrying', `Retrying... (${reconnectAttempts})`)
  }

  switch (status) {
    case 'connected':
      return t('chat.connected', 'Connected')
    case 'connecting':
      return t('chat.connecting', 'Connecting...')
    case 'reconnecting':
      return t('chat.reconnecting', `Reconnecting... (${reconnectAttempts})`)
    case 'disconnected':
      return t('chat.disconnected', 'Disconnected')
    case 'error':
      return t('chat.connection_error', 'Connection Error')
    default:
      return t('chat.unknown', 'Unknown')
  }
}

const formatLastConnected = (date: Date | null): string => {
  if (!date) return 'Never'

  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}

export default function ConnectionStatusIndicator({
  connectionInfo,
  offlineState,
  onReconnect,
  onRetryMessages,
  onClearQueue,
  className = '',
}: ConnectionStatusIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false)
  const { t } = useTranslation()

  // Memoize computed values to prevent unnecessary re-renders
  const statusColor = useMemo(() => getStatusColor(connectionInfo.status), [connectionInfo.status])
  const statusIcon = useMemo(
    () => getStatusIcon(connectionInfo.status, connectionInfo.isRetrying),
    [connectionInfo.status, connectionInfo.isRetrying]
  )
  const statusText = useMemo(
    () =>
      getStatusText(
        connectionInfo.status,
        connectionInfo.isRetrying,
        connectionInfo.reconnectAttempts,
        t
      ),
    [connectionInfo.status, connectionInfo.isRetrying, connectionInfo.reconnectAttempts, t]
  )

  const hasQueuedMessages = useMemo(() => offlineState.queueSize > 0, [offlineState.queueSize])
  const isOffline = useMemo(
    () => offlineState.isOffline || connectionInfo.status !== 'connected',
    [offlineState.isOffline, connectionInfo.status]
  )

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Status Indicator */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="flex cursor-pointer items-center gap-2"
              onClick={() => setShowDetails(!showDetails)}
            >
              <div className={`h-2 w-2 rounded-full ${statusColor}`} />
              {statusIcon}
              <span className="text-sm font-medium">{statusText}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p>Status: {statusText}</p>
              <p>Last connected: {formatLastConnected(connectionInfo.lastConnected)}</p>
              {connectionInfo.lastError && (
                <p className="text-red-400">Error: {connectionInfo.lastError.message}</p>
              )}
              {offlineState.isOffline && <p className="text-yellow-400">Offline mode active</p>}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Offline Badge */}
        {offlineState.isOffline && (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <WifiOff className="mr-1 h-3 w-3" />
            {t('chat.offline', 'Offline')}
          </Badge>
        )}

        {/* Queued Messages Badge */}
        {hasQueuedMessages && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                <Clock className="mr-1 h-3 w-3" />
                {offlineState.queueSize} {t('chat.queued', 'queued')}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {offlineState.queueSize} {t('chat.messages_waiting', 'messages waiting to be sent')}
              </p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Action Buttons */}
        {isOffline && (
          <Button
            size="sm"
            variant="outline"
            onClick={onReconnect}
            disabled={connectionInfo.isRetrying}
            className="h-7"
          >
            {connectionInfo.isRetrying ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              t('chat.reconnect', 'Reconnect')
            )}
          </Button>
        )}

        {hasQueuedMessages && (
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={onRetryMessages} className="h-7 text-xs">
              {t('chat.retry', 'Retry')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onClearQueue}
              className="h-7 text-xs text-red-600 hover:text-red-700"
            >
              {t('chat.clear', 'Clear')}
            </Button>
          </div>
        )}
      </div>

      {/* Detailed Status Panel */}
      {showDetails && (
        <div className="absolute top-full left-0 z-50 mt-2 min-w-80 rounded-lg border bg-white p-4 shadow-lg">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Connection Status</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDetails(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Status</p>
                <p className="font-medium">{statusText}</p>
              </div>
              <div>
                <p className="text-gray-600">Last Connected</p>
                <p className="font-medium">{formatLastConnected(connectionInfo.lastConnected)}</p>
              </div>
              <div>
                <p className="text-gray-600">Retry Attempts</p>
                <p className="font-medium">
                  {connectionInfo.reconnectAttempts} / {connectionInfo.maxReconnectAttempts}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Queued Messages</p>
                <p className="font-medium">{offlineState.queueSize}</p>
              </div>
            </div>

            {connectionInfo.lastError && (
              <div className="rounded border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-medium text-red-800">Last Error</p>
                <p className="text-sm text-red-600">{connectionInfo.lastError.message}</p>
                <p className="mt-1 text-xs text-red-500">
                  {connectionInfo.lastError.timestamp.toLocaleString()}
                </p>
              </div>
            )}

            {offlineState.isOffline && (
              <div className="rounded border border-yellow-200 bg-yellow-50 p-3">
                <p className="text-sm font-medium text-yellow-800">Offline Mode</p>
                <p className="text-sm text-yellow-600">
                  Messages will be queued and sent when connection is restored
                </p>
                {offlineState.lastOnline && (
                  <p className="mt-1 text-xs text-yellow-500">
                    Last online: {formatLastConnected(offlineState.lastOnline)}
                  </p>
                )}
              </div>
            )}

            {hasQueuedMessages && (
              <div className="rounded border border-blue-200 bg-blue-50 p-3">
                <p className="text-sm font-medium text-blue-800">Queued Messages</p>
                <p className="text-sm text-blue-600">
                  {offlineState.queueSize} messages waiting to be sent
                </p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={onRetryMessages} className="h-7">
                    Retry All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onClearQueue}
                    className="h-7 text-red-600 hover:text-red-700"
                  >
                    Clear Queue
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </TooltipProvider>
  )
}
