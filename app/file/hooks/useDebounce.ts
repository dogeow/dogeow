import { useState, useEffect } from 'react'

/**
 * 防抖 Hook
 * @param value 需要防抖的值
 * @param delay 防抖延迟时间（毫秒）
 * @returns 防抖后的值
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * 搜索防抖 Hook
 * @param searchQuery 搜索查询字符串
 * @param delay 防抖延迟时间（毫秒）
 * @param minLength 最小搜索长度
 * @returns 防抖后的搜索查询和是否正在搜索的状态
 */
export function useSearchDebounce(
  searchQuery: string, 
  delay: number = 300, 
  minLength: number = 1
) {
  const [isSearching, setIsSearching] = useState(false)
  const debouncedQuery = useDebounce(searchQuery, delay)

  useEffect(() => {
    if (searchQuery !== debouncedQuery) {
      setIsSearching(true)
    } else {
      setIsSearching(false)
    }
  }, [searchQuery, debouncedQuery])

  // 只有当查询长度满足要求时才返回有效的搜索查询
  const effectiveQuery = debouncedQuery.length >= minLength ? debouncedQuery : ''

  return {
    debouncedQuery: effectiveQuery,
    isSearching,
    hasQuery: effectiveQuery.length > 0
  }
} 