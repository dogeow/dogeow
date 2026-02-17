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

const SUBSCRIBE_DEBOUNCE_MS = 150

export function useCombatWebSocket(characterId: number | null) {
  const echoRef = useRef<Echo<'reverb'> | null>(null)
  const channelRef = useRef<ReturnType<Echo<'reverb'>['channel']> | null>(null)
  const subscribedCharacterIdRef = useRef<number | null>(null)
  const subscribedAtRef = useRef<number>(0)
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

    // 在连接就绪后订阅（与聊天室一致，避免连接未建立就 subscribe 被忽略）
    let connectionCleanup: (() => void) | null = null

    const doSubscribe = () => {
      if (!echoRef.current) return
      const ch = echoRef.current.channel(`game.${characterId}`)
      channelRef.current = ch
      subscribedAtRef.current = Date.now()
      console.log('WebSocket: 已订阅频道 game.' + characterId)

      ch.listen('.combat.update', (data: CombatUpdateData) => {
        console.log('🎮 Combat update received:', data)
        useGameStore.getState().handleCombatUpdate(data)
      })
      ch.listen('.loot.dropped', (data: LootDroppedData) => {
        console.log('💎 Loot dropped:', data)
        useGameStore.getState().handleLootDropped(data)
      })
      ch.listen('.level.up', (data: LevelUpData) => {
        console.log('🎉 Level up:', data)
        useGameStore.getState().handleLevelUp(data)
      })
      subscribedCharacterIdRef.current = characterId
    }

    try {
      const connector = echo.connector as EchoConnector
      const connection = connector?.pusher?.connection
      if (connection) {
        const handleConnected = () => {
          console.log('WebSocket: 已连接')
          setIsConnected(true)
          setAuthError(false)
          doSubscribe()
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
        connectionCleanup = () => {
          connection.unbind('connected', handleConnected)
          connection.unbind('error', handleError)
          connection.unbind('disconnected', handleDisconnected)
        }

        if (connection.state === 'connected') {
          doSubscribe()
        }
      } else {
        doSubscribe()
      }
    } catch (error) {
      console.warn('WebSocket: 无法绑定连接事件', error)
      doSubscribe()
    }

    // 清理函数：避免 React Strict Mode 下刚订阅就被 cleanup 取消（150ms 内不真正 unsubscribe）
    return () => {
      connectionCleanup?.()
      if (subscribedCharacterIdRef.current !== characterId) return
      if (Date.now() - subscribedAtRef.current < SUBSCRIBE_DEBOUNCE_MS) return

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
