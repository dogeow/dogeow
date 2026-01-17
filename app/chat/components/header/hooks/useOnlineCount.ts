import { useMemo } from 'react'
import type { ChatRoom, OnlineUser } from '../../types'

export function useOnlineCount(
  room: ChatRoom,
  onlineUsers: Record<string, OnlineUser[]>,
  isConnected: boolean
) {
  const roomOnlineUsers = useMemo(
    () => onlineUsers[room.id.toString()] || [],
    [onlineUsers, room.id]
  )

  const onlineCount = useMemo(() => {
    const storeCount = roomOnlineUsers.length
    const roomCount = room.online_count ?? 0
    const connectedSelf = isConnected ? 1 : 0
    return Math.max(storeCount, roomCount, connectedSelf)
  }, [roomOnlineUsers.length, room.online_count, isConnected])

  return { roomOnlineUsers, onlineCount }
}
