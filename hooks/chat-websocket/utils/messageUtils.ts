import { getAuthManager } from '@/lib/websocket'
import useChatStore from '@/app/chat/chatStore'
import type { ConnectionError } from '@/lib/websocket/error-handler'

/**
 * 发送消息到服务器
 */
export const sendMessageToServer = async (
  roomId: string,
  message: string
): Promise<{ success: boolean; data?: unknown; error?: ConnectionError }> => {
  try {
    const authManager = getAuthManager()
    const token = authManager.getToken()

    if (!token) {
      return {
        success: false,
        error: {
          type: 'authentication',
          message: 'No authentication token available',
          timestamp: new Date(),
          retryable: false,
        },
      }
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
      const errorPayload = await response
        .clone()
        .json()
        .catch(() => null)
      const errorMessage =
        typeof errorPayload?.message === 'string' ? errorPayload.message : response.statusText

      // 处理禁言错误
      if (response.status === 403) {
        const normalized = errorMessage.toLowerCase()
        if (normalized.includes('mute')) {
          const match = errorMessage.match(/until\s+([0-9:\-\s]+)/i)
          const mutedUntil = match?.[1]?.trim()
          useChatStore.getState().updateMuteStatus(true, mutedUntil, errorMessage || 'Muted')
          return {
            success: false,
            error: {
              type: 'permission',
              message: errorMessage,
              timestamp: new Date(),
              retryable: false,
            },
          }
        }

        // 尝试刷新 token
        const newToken = await authManager.refreshToken()
        if (newToken) {
          // 递归重试
          return sendMessageToServer(roomId, message)
        }

        return {
          success: false,
          error: {
            type: 'authentication',
            message: 'Authentication failed - token expired and refresh failed',
            timestamp: new Date(),
            retryable: false,
          },
        }
      }

      return {
        success: false,
        error: {
          type: 'network',
          message: errorMessage || `Failed to send message: ${response.statusText}`,
          timestamp: new Date(),
          retryable: true,
        },
      }
    }

    const responseData = await response.json()
    return {
      success: true,
      data: responseData.data,
    }
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'network',
        message: error instanceof Error ? error.message : 'Failed to send message',
        timestamp: new Date(),
        retryable: true,
      },
    }
  }
}

/**
 * 离开房间（通过 API）
 */
export const leaveRoomViaAPI = async (roomId: string): Promise<void> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/rooms/${roomId}/leave`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAuthManager().getToken()}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      console.log('WebSocket: Successfully left room via API')
    } else {
      console.warn('WebSocket: Failed to leave room via API:', response.status)
    }
  } catch (error) {
    console.error('WebSocket: Error leaving room via API:', error)
  }
}
