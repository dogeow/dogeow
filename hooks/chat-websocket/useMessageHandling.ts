/**
 * WebSocket 消息处理 Hook
 */
import { useCallback } from 'react'
import { getAuthManager } from '@/lib/websocket'

export const useMessageHandling = () => {
  const sendMessage = useCallback(async (roomId: string, message: string): Promise<boolean> => {
    try {
      const authManager = getAuthManager()
      const token = authManager.getToken()

      if (!token) {
        throw new Error('No authentication token')
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/chat/rooms/${roomId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message }),
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`)
      }

      return true
    } catch (error) {
      console.error('发送消息失败:', error)
      return false
    }
  }, [])

  return {
    sendMessage,
  }
}
