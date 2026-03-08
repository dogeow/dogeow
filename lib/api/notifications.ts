'use client'

import useSWR from 'swr'

import { get, post } from './core'
import { baseSWRConfig, apiFetcher } from './swr'

// 未读通知（拉取时会触发后端「打开时补发汇总推送」）
export interface UnreadNotificationItem {
  id: string
  type: string
  data: {
    title?: string
    body?: string
    url?: string
    icon?: string
    notification_id?: string
  }
  created_at: string
}

export interface UnreadNotificationsResponse {
  count: number
  items: UnreadNotificationItem[]
}

export const fetchUnreadNotifications = () =>
  get<UnreadNotificationsResponse>('notifications/unread')

export const useUnreadNotifications = () =>
  useSWR<UnreadNotificationsResponse>('notifications/unread', apiFetcher, {
    ...baseSWRConfig,
    revalidateOnFocus: true,
  })

export const markNotificationRead = (id: string) =>
  post<{ message: string }>(`notifications/${id}/read`, {})

export const markAllNotificationsRead = () =>
  post<{ message: string }>('notifications/read-all', {})
