'use client'

import { useEffect } from 'react'
import { useSWRConfig } from 'swr'
import { createEchoInstance, getEchoInstance } from '@/lib/websocket'
import { fetchCurrentUser } from '@/lib/api'
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
  const loading = useAuthStore(s => s.loading)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const userId = useAuthStore(s => s.user?.id)
  const setUser = useAuthStore(s => s.setUser)
  const { mutate } = useSWRConfig()

  useEffect(() => {
    if (loading || !isAuthenticated) return

    const eventName = '.notification.created'
    const handleNotificationCreated = (_event: NotificationCreatedEvent) => {
      void mutate('notifications/unread')
    }

    let isCancelled = false
    let cleanup: (() => void) | null = null

    const subscribe = async () => {
      try {
        const currentUser = await fetchCurrentUser()
        if (isCancelled) return

        if (userId !== currentUser.id) {
          setUser(currentUser)
        }

        const echo = getEchoInstance() ?? createEchoInstance()
        if (!echo) return

        const channelName = `user.${currentUser.id}.notifications`
        const channel = echo.private(channelName)

        channel.listen(eventName, handleNotificationCreated)

        cleanup = () => {
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
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('通知频道订阅前同步当前用户失败:', error)
        }
      }
    }

    void subscribe()

    return () => {
      isCancelled = true
      cleanup?.()
    }
  }, [loading, isAuthenticated, userId, setUser, mutate])

  return null
}
