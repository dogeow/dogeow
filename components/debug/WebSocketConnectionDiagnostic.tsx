'use client'

import { useEffect, useState } from 'react'
import { getConnectionMonitor } from '@/lib/websocket/connection-monitor'
import { getEchoInstance } from '@/lib/websocket/echo'
import type { ConnectionMonitor } from '@/lib/websocket/connection-monitor'

export function WebSocketConnectionDiagnostic() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionMonitor | null>(null)

  useEffect(() => {
    const monitor = getConnectionMonitor()
    if (monitor) {
      const unsubscribe = monitor.subscribe(status => {
        setConnectionStatus(status)
      })

      // 获取初始状态
      setConnectionStatus(monitor.getStatus())

      return unsubscribe
    }
  }, [])

  const echoInstance = getEchoInstance()

  return (
    <div className="rounded-lg border bg-gray-50 p-4">
      <h3 className="mb-4 text-lg font-semibold">WebSocket 连接诊断</h3>

      <div className="space-y-3">
        <div>
          <span className="font-medium">连接状态: </span>
          <span
            className={`rounded px-2 py-1 text-sm ${
              connectionStatus?.status === 'connected'
                ? 'bg-green-100 text-green-800'
                : connectionStatus?.status === 'connecting'
                  ? 'bg-yellow-100 text-yellow-800'
                  : connectionStatus?.status === 'error'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
            }`}
          >
            {connectionStatus?.status || '未知'}
          </span>
        </div>

        <div>
          <span className="font-medium">Echo 实例: </span>
          <span className={echoInstance ? 'text-green-600' : 'text-red-600'}>
            {echoInstance ? '已创建' : '未创建'}
          </span>
        </div>

        {connectionStatus?.lastConnected && (
          <div>
            <span className="font-medium">最后连接时间: </span>
            <span className="text-sm text-gray-600">
              {connectionStatus.lastConnected.toLocaleString()}
            </span>
          </div>
        )}

        <div>
          <span className="font-medium">重连尝试次数: </span>
          <span className="text-sm text-gray-600">
            {connectionStatus?.reconnectAttempts || 0} /{' '}
            {connectionStatus?.maxReconnectAttempts || 5}
          </span>
        </div>

        {connectionStatus?.lastError && (
          <div>
            <span className="font-medium">最后错误: </span>
            <span className="text-sm text-red-600">{connectionStatus.lastError.message}</span>
          </div>
        )}
      </div>
    </div>
  )
}
