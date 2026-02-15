import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { performFullSearch } from '../api/searchApi'
import type { SearchResult } from '../types'
import { useTranslation } from '@/hooks/useTranslation'

/**
 * useSearchData hook 配置选项
 */
interface UseSearchDataOptions {
  isAuthenticated: boolean
  searchTerm: string
  activeCategory: string
  /** 防抖延迟（毫秒） */
  debounceMs?: number
}

/**
 * useSearchData hook 返回值
 */
interface UseSearchDataResult {
  results: SearchResult[]
  loading: boolean
  hasSearched: boolean
  /** 手动触发搜索 */
  performSearch: () => Promise<void>
  /** 获取每个分类的结果数量 */
  getCountByCategory: (category: string) => number
}

/**
 * 搜索数据 hook
 *
 * @example
 * ```tsx
 * const { results, loading, hasSearched } = useSearchData({
 *   isAuthenticated: !!token,
 *   searchTerm: query,
 *   activeCategory: 'all',
 * })
 * ```
 */
export function useSearchData({
  isAuthenticated,
  searchTerm,
  activeCategory,
  debounceMs = 500,
}: UseSearchDataOptions): UseSearchDataResult {
  const { t } = useTranslation()
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // 使用 ref 存储上次的搜索参数
  const lastSearchRef = useRef({
    searchTerm: '',
    activeCategory: 'all',
  })

  // 使用 ref 存储 abort controller
  const abortControllerRef = useRef<AbortController | null>(null)

  // 实际的搜索函数
  const performSearch = useCallback(async () => {
    const trimmedTerm = searchTerm.trim()

    // 空搜索词，清空结果
    if (!trimmedTerm) {
      setResults([])
      setHasSearched(false)
      lastSearchRef.current = {
        searchTerm: '',
        activeCategory,
      }
      return
    }

    // 检查是否与上次搜索参数相同
    const currentParams = {
      searchTerm: trimmedTerm,
      activeCategory,
    }

    if (
      lastSearchRef.current.searchTerm === currentParams.searchTerm &&
      lastSearchRef.current.activeCategory === currentParams.activeCategory
    ) {
      return
    }

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // 创建新的 abort controller
    abortControllerRef.current = new AbortController()

    // 更新上次搜索参数
    lastSearchRef.current = currentParams
    setLoading(true)

    try {
      const searchResults = await performFullSearch({
        query: trimmedTerm,
        category: activeCategory,
        isAuthenticated,
        t,
      })

      setResults(searchResults)
    } catch (error) {
      // 忽略 abort 错误
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      console.error('搜索出错:', error)
    } finally {
      setLoading(false)
      setHasSearched(true)
    }
  }, [searchTerm, activeCategory, isAuthenticated, t])

  // 防抖执行搜索
  useEffect(() => {
    const trimmedTerm = searchTerm.trim()

    // 空搜索词时立即清空
    if (!trimmedTerm) {
      setResults([])
      setHasSearched(false)
      lastSearchRef.current = {
        searchTerm: '',
        activeCategory,
      }
      return
    }

    const timer = setTimeout(() => {
      performSearch()
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [searchTerm, activeCategory, debounceMs, performSearch])

  // 获取每个分类的结果数量
  const getCountByCategory = useCallback(
    (category: string) => {
      if (!searchTerm.trim()) return 0
      return results.filter(item => category === 'all' || item.category === category).length
    },
    [searchTerm, results]
  )

  // 按分类过滤结果
  const filteredResults = useMemo(
    () => results.filter(item => activeCategory === 'all' || item.category === activeCategory),
    [results, activeCategory]
  )

  return {
    results: filteredResults,
    loading,
    hasSearched,
    performSearch,
    getCountByCategory,
  }
}
