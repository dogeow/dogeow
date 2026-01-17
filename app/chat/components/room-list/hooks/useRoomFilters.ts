import { useMemo } from 'react'
import type { ChatRoom } from '@/app/chat/types'
import useChatStore from '@/app/chat/chatStore'

interface UseRoomFiltersProps {
  rooms: ChatRoom[]
  searchQuery: string
  filterType: 'all' | 'favorites' | 'recent'
  favoriteRooms: Set<number>
  recentRooms: number[]
}

export const useRoomFilters = ({
  rooms,
  searchQuery,
  filterType,
  favoriteRooms,
  recentRooms,
}: UseRoomFiltersProps) => {
  const { getRoomUnreadCount } = useChatStore()

  const filteredRooms = useMemo(() => {
    if (!Array.isArray(rooms)) {
      console.warn('ChatRoomList: rooms is not an array:', rooms)
      return []
    }

    let filtered = [...rooms]

    // 搜索过滤
    const search = searchQuery.trim().toLowerCase()
    if (search) {
      filtered = filtered.filter(
        room =>
          room.name.toLowerCase().includes(search) ||
          (room.description?.toLowerCase() ?? '').includes(search)
      )
    }

    // 分类过滤
    switch (filterType) {
      case 'favorites':
        filtered = filtered.filter(room => favoriteRooms.has(room.id))
        break
      case 'recent':
        filtered = filtered.filter(room => recentRooms.includes(room.id))
        // 按 recent 顺序排序
        filtered.sort((a, b) => recentRooms.indexOf(a.id) - recentRooms.indexOf(b.id))
        break
      default:
        // 按未读数->名字排序
        filtered.sort((a, b) => {
          const aUnread = getRoomUnreadCount(a.id)
          const bUnread = getRoomUnreadCount(b.id)
          if (aUnread !== bUnread) return bUnread - aUnread
          return a.name.localeCompare(b.name)
        })
    }

    return filtered
  }, [rooms, searchQuery, filterType, favoriteRooms, recentRooms, getRoomUnreadCount])

  return filteredRooms
}
