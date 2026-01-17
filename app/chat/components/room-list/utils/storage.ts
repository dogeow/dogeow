/**
 * 安全获取 localStorage
 */
export const getSafeStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null
  try {
    const storage = window.localStorage
    const testKey = '__storage_test__'
    storage.setItem(testKey, '1')
    storage.removeItem(testKey)
    return storage
  } catch (error) {
    console.warn('本地存储不可用，已跳过偏好读取:', error)
    return null
  }
}

/**
 * 从 localStorage 加载收藏房间
 */
export const loadFavoriteRooms = (): Set<number> => {
  const storage = getSafeStorage()
  if (!storage) return new Set()

  try {
    const savedFavorites = storage.getItem('chat-favorite-rooms')
    if (savedFavorites) {
      return new Set(JSON.parse(savedFavorites))
    }
  } catch (error) {
    console.error('Failed to load favorite rooms:', error)
  }

  return new Set()
}

/**
 * 保存收藏房间到 localStorage
 */
export const saveFavoriteRooms = (favorites: Set<number>): void => {
  const storage = getSafeStorage()
  if (!storage) return

  try {
    storage.setItem('chat-favorite-rooms', JSON.stringify([...favorites]))
  } catch (error) {
    console.error('Failed to save favorite rooms:', error)
  }
}

/**
 * 从 localStorage 加载最近房间
 */
export const loadRecentRooms = (): number[] => {
  const storage = getSafeStorage()
  if (!storage) return []

  try {
    const savedRecent = storage.getItem('chat-recent-rooms')
    if (savedRecent) {
      return JSON.parse(savedRecent)
    }
  } catch (error) {
    console.error('Failed to load recent rooms:', error)
  }

  return []
}

/**
 * 保存最近房间到 localStorage
 */
export const saveRecentRooms = (recent: number[]): void => {
  const storage = getSafeStorage()
  if (!storage) return

  try {
    storage.setItem('chat-recent-rooms', JSON.stringify(recent))
  } catch (error) {
    console.error('Failed to save recent rooms:', error)
  }
}
