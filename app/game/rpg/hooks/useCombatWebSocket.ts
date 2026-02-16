'use client'

import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../stores/gameStore'
import { createEchoInstance } from '@/lib/websocket'
import { toast } from 'sonner'
import type Echo from 'laravel-echo'
import type { GameCharacter, GameItem } from '../types'

interface CombatUpdateData {
  victory: boolean
  monster: { name: string; type: string; level: number }
  damage_dealt: number
  damage_taken: number
  rounds: number
  experience_gained: number
  copper_gained: number
  loot?: {
    item?: GameItem
    copper: number
  }
  character: GameCharacter
  combat_log_id: number
}

interface LootDroppedData {
  item?: GameItem
  copper: number
}

interface LevelUpData {
  level: number
  character: GameCharacter
}

interface PusherConnection {
  state: string
  bind: (event: string, callback: (data?: unknown) => void) => void
  unbind: (event: string, callback?: (data?: unknown) => void) => void
}

interface PusherConnector {
  connection: PusherConnection
}

interface EchoConnector {
  pusher?: PusherConnector
}

export function useCombatWebSocket(characterId: number | null) {
  const echoRef = useRef<Echo<'reverb'> | null>(null)
  const channelRef = useRef<ReturnType<Echo<'reverb'>['private']> | null>(null)
  const subscribedCharacterIdRef = useRef<number | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [authError, setAuthError] = useState(false)

  useEffect(() => {
    // 如果没有角色ID，或者已经订阅了相同的角色，跳过
    if (!characterId || subscribedCharacterIdRef.current === characterId) {
      return
    }

    // 如果之前订阅了其他角色，先清理
    if (subscribedCharacterIdRef.current !== null && channelRef.current) {
      console.log('WebSocket: 清理之前的订阅')
      try {
        channelRef.current.stopListening('.combat.update')
        channelRef.current.stopListening('.loot.dropped')
        channelRef.current.stopListening('.level.up')
        channelRef.current.unsubscribe()
      } catch (error) {
        console.warn('WebSocket: 清理之前的频道时出错', error)
      }
      channelRef.current = null
    }

    // 使用 setTimeout 避免在 effect 中同步调用 setState
    setTimeout(() => setAuthError(false), 0)

    // 初始化 Echo
    const echo = createEchoInstance()
    if (!echo) {
      console.warn('WebSocket: Failed to create Echo instance')
      toast.error('实时连接初始化失败')
      return
    }

    echoRef.current = echo

    // 检查 Echo 连接状态
    try {
      const connector = echo.connector as EchoConnector
      if (connector?.pusher?.connection) {
        const connection = connector.pusher.connection

        // 监听连接状态
        const handleConnected = () => {
          console.log('WebSocket: 已连接')
          setIsConnected(true)
          setAuthError(false)
        }

        const handleError = (error: unknown) => {
          console.error('WebSocket: 连接错误', error)
          setIsConnected(false)
          setAuthError(true)
          toast.error('WebSocket 连接失败，游戏功能正常，但实时更新可能受影响')
        }

        const handleDisconnected = () => {
          console.log('WebSocket: 已断开')
          setIsConnected(false)
        }

        connection.bind('connected', handleConnected)
        connection.bind('error', handleError)
        connection.bind('disconnected', handleDisconnected)

        // 清理连接监听器
        return () => {
          connection.unbind('connected', handleConnected)
          connection.unbind('error', handleError)
          connection.unbind('disconnected', handleDisconnected)
        }
      }
    } catch (error) {
      console.warn('WebSocket: 无法绑定连接事件', error)
    }

    // 订阅私有频道
    console.log(`WebSocket: 正在订阅频道 private-game.${characterId}`)
    const channel = echo.private(`game.${characterId}`)
    channelRef.current = channel

    // Pusher 会自动处理认证，如果认证失败会触发连接错误事件
    // 我们通过检查 Pusher 的连接状态来判断认证是否成功
    setTimeout(() => {
      try {
        const connector = echo.connector as EchoConnector
        const state = connector?.pusher?.connection?.state
        if (state !== 'connected' && state !== 'connecting') {
          console.warn(`WebSocket: 订阅频道可能失败，当前状态: ${state}`)
          setAuthError(true)
        } else {
          console.log(`WebSocket: 频道 private-game.${characterId} 订阅成功`)
        }
      } catch (error) {
        console.warn('WebSocket: 无法检查频道订阅状态', error)
      }
    }, 2000) // 2秒后检查连接状态

    // 监听战斗更新事件
    channel.listen('.combat.update', (data: CombatUpdateData) => {
      console.log('🎮 Combat update received:', data)
      useGameStore.getState().handleCombatUpdate(data)
    })

    // 监听掉落事件
    channel.listen('.loot.dropped', (data: LootDroppedData) => {
      console.log('💎 Loot dropped:', data)
      useGameStore.getState().handleLootDropped(data)
    })

    // 监听升级事件
    channel.listen('.level.up', (data: LevelUpData) => {
      console.log('🎉 Level up:', data)
      useGameStore.getState().handleLevelUp(data)
    })

    subscribedCharacterIdRef.current = characterId

    // 清理函数
    return () => {
      // 只有当前订阅的角色才清理
      if (subscribedCharacterIdRef.current !== characterId) return

      console.log('WebSocket: 清理连接')
      if (channelRef.current) {
        try {
          channelRef.current.stopListening('.combat.update')
          channelRef.current.stopListening('.loot.dropped')
          channelRef.current.stopListening('.level.up')
          channelRef.current.unsubscribe()
        } catch (error) {
          console.warn('WebSocket: 清理频道时出错', error)
        }
        channelRef.current = null
      }
      subscribedCharacterIdRef.current = null
      setIsConnected(false)
    }
  }, [characterId])

  // 返回连接状态，供 UI 显示（可选）
  return { isConnected, authError }
}
