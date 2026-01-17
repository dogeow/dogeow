import { useState } from 'react'
import {
  loadFavoriteRooms,
  saveFavoriteRooms,
  loadRecentRooms,
  saveRecentRooms,
} from '../utils/storage'

export const useRoomPreferences = () => {
  const [favoriteRooms, setFavoriteRooms] = useState<Set<number>>(() => loadFavoriteRooms())
  const [recentRooms, setRecentRooms] = useState<number[]>(() => loadRecentRooms())

  // 切换收藏
  const toggleFavorite = (roomId: number) => {
    setFavoriteRooms(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(roomId)) {
        newFavorites.delete(roomId)
      } else {
        newFavorites.add(roomId)
      }
      saveFavoriteRooms(newFavorites)
      return newFavorites
    })
  }

  // 添加最近房间
  const addRecentRoom = (roomId: number) => {
    setRecentRooms(prev => {
      const newRecent = [roomId, ...prev.filter(id => id !== roomId)].slice(0, 10)
      saveRecentRooms(newRecent)
      return newRecent
    })
  }

  return {
    favoriteRooms,
    recentRooms,
    toggleFavorite,
    addRecentRoom,
  }
}
