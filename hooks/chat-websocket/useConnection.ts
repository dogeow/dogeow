/**
 * WebSocket 连接管理 Hook
 */
import { useState, useCallback, useRef } from 'react'
import Echo from 'laravel-echo'
import { createEchoInstance, getAuthManager } from '@/lib/websocket'

export const useConnection = () => {
  const [echo, setEcho] = useState<Echo<'reverb'> | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('disconnected')
  const isComponentMountedRef = useRef(true)

  const connect = useCallback(async (): Promise<boolean> => {
    if (!isComponentMountedRef.current) {
      return false
    }

    try {
      const authManager = getAuthManager()
      const token = authManager.getToken()

      if (!token) {
        console.error('No auth token available')
        return false
      }

      const echoInstance = createEchoInstance()
      if (!echoInstance) {
        console.error('Failed to create Echo instance')
        return false
      }

      setEcho(echoInstance)
      setConnectionStatus('connected')
      setIsConnected(true)
      return true
    } catch (error) {
      console.error('Connection failed:', error)
      setConnectionStatus('disconnected')
      setIsConnected(false)
      return false
    }
  }, [])

  const disconnect = useCallback(() => {
    setEcho(null)
    setConnectionStatus('disconnected')
    setIsConnected(false)
  }, [])

  return {
    echo,
    isConnected,
    connectionStatus,
    connect,
    disconnect,
  }
}
