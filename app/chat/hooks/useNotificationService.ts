import { useRef, useCallback } from 'react'
import NotificationService from '@/lib/services/notificationService'

export function useNotificationService() {
  const notificationServiceRef = useRef<NotificationService | null>(null)

  // 获取通知服务实例 - 优化：避免重复创建
  const getNotificationService = useCallback(() => {
    if (!notificationServiceRef.current) {
      notificationServiceRef.current = NotificationService.getInstance()
    }
    return notificationServiceRef.current
  }, [])

  return { getNotificationService }
}
