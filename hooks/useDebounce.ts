import { useState, useEffect, useMemo } from 'react'

/**
 * 通用防抖 hook
 * @param value 需要防抖的值
 * @param delay 延迟毫秒
 * @returns 防抖后的值
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
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
 * 搜索专用防抖逻辑，带最小长度判断
 */
export function useSearchDebounce(searchQuery: string, delay: number = 300, minLength: number = 1) {
  const debouncedQuery = useDebounce(searchQuery, delay)

  const isSearching = useMemo(() => searchQuery !== debouncedQuery, [searchQuery, debouncedQuery])

  const effectiveQuery = debouncedQuery.length >= minLength ? debouncedQuery : ''

  return {
    debouncedQuery: effectiveQuery,
    isSearching,
    hasQuery: effectiveQuery.length > 0,
  }
}
