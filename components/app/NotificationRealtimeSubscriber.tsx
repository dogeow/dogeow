'use client'

import { useEffect } from 'react'
import { useSWRConfig } from 'swr'
import { createEchoInstance, getEchoInstance } from '@/lib/websocket'
import useAuthStore from '@/stores/authStore'

interface NotificationCreatedEvent {
  notification?: {
    id?: string
    type?: string
    data?: Record<string, unknown>
    created_at?: string
  }
  count?: number
}

/**
 * 全局实时订阅用户通知私有频道；收到新通知后刷新未读数/列表。
 */
export function NotificationRealtimeSubscriber() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const userId = useAuthStore(s => s.user?.id)
  const { mutate } = useSWRConfig()

  useEffect(() => {
    if (!isAuthenticated || !userId) return

    const echo = getEchoInstance() ?? createEchoInstance()
    if (!echo) return

    const channelName = `user.${userId}.notifications`
    const eventName = '.notification.created'
    const channel = echo.private(channelName)

    const handleNotificationCreated = (_event: NotificationCreatedEvent) => {
      void mutate('notifications/unread')
    }

    channel.listen(eventName, handleNotificationCreated)

    return () => {
      try {
        channel.stopListening(eventName)
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('通知频道停止监听失败:', error)
        }
      }

      try {
        echo.leave(channelName)
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('通知频道离开失败:', error)
        }
      }
    }
  }, [isAuthenticated, userId, mutate])

  return null
}
