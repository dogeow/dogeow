/**
 * 安全的本地存储封装（兼容无痕/隐私模式）
 */

// 内存存储实现
const createMemoryStorage = () => {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
  }
}

const memoryStorage = createMemoryStorage()

/**
 * 获取安全的存储对象，如果 localStorage 不可用则降级到内存存储
 */
export const getSafeStorage = () => {
  if (typeof window === 'undefined') return memoryStorage

  try {
    const storage = window.localStorage
    const testKey = '__storage_test__'
    storage.setItem(testKey, '1')
    storage.removeItem(testKey)
    return storage
  } catch (error) {
    console.warn('本地存储不可用，已降级到内存存储:', error)
    return memoryStorage
  }
}
