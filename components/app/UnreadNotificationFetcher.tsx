'use client'

import useSWR from 'swr'
import { get } from '@/lib/api'
import type { UnreadNotificationsResponse } from '@/lib/api'
import useAuthStore from '@/stores/authStore'
import { useEffect } from 'react'
import { toast } from 'sonner'

const fetcher = (url: string) => get<UnreadNotificationsResponse>(url)

/**
 * 登录状态下拉取未读通知：触发后端「打开时补发汇总推送」；
 * 若有未读且本次会话未提示过，则 Toast 一次。
 */
export function UnreadNotificationFetcher() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const { data } = useSWR<UnreadNotificationsResponse>(
    isAuthenticated ? 'notifications/unread' : null,
    fetcher,
    { revalidateOnFocus: true }
  )

  useEffect(() => {
    if (!isAuthenticated || !data?.count) return
    const key = 'unread-notification-toast-shown'
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    toast.info(`你有 ${data.count} 条未读消息`, {
      action: {
        label: '查看',
        onClick: () => window.location.assign('/chat'),
      },
    })
  }, [isAuthenticated, data?.count])

  return null
}
