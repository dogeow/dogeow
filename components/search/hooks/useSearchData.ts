import { useState, useCallback, useRef, useEffect } from 'react'
import { get } from '@/lib/api'
import { searchLocalData } from '../utils/searchLocalData'
import type { SearchResult } from '../types'
import { useTranslation } from '@/hooks/useTranslation'

interface UseSearchDataOptions {
  isAuthenticated: boolean
  searchTerm: string
  activeCategory: string
}

export function useSearchData({
  isAuthenticated,
  searchTerm,
  activeCategory,
}: UseSearchDataOptions) {
  const { t } = useTranslation()
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // 添加上次搜索参数的引用，用于避免重复搜索
  const lastSearchRef = useRef<{
    searchTerm: string
    activeCategory: string
  }>({
    searchTerm: '',
    activeCategory: 'all',
  })

  const performSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      setResults([])
      setHasSearched(false)
      lastSearchRef.current = {
        searchTerm: '',
        activeCategory,
      }
      return
    }

    // 检查是否与上次搜索参数相同，避免重复搜索
    const currentSearchParams = {
      searchTerm: searchTerm.trim(),
      activeCategory,
    }

    if (
      lastSearchRef.current.searchTerm === currentSearchParams.searchTerm &&
      lastSearchRef.current.activeCategory === currentSearchParams.activeCategory
    ) {
      console.log('搜索参数未变化，跳过重复搜索')
      return
    }

    // 更新上次搜索参数
    lastSearchRef.current = currentSearchParams

    setLoading(true)

    try {
      const allResults: SearchResult[] = []

      // 搜索本地数据（游戏、导航等）
      const localResults = searchLocalData(searchTerm, activeCategory, isAuthenticated, t)
      allResults.push(...localResults)

      // 搜索数据库中的物品（后端已经处理了权限控制）
      if (activeCategory === 'all' || activeCategory === 'thing') {
        interface SearchApiResponse {
          results: Array<{
            id: number
            name: string
            description?: string
            is_public?: boolean
            user_id?: number
            thumbnail_url?: string | null
            [key: string]: unknown
          }>
          user_authenticated: boolean
        }

        const queryParams = new URLSearchParams({
          q: searchTerm,
        })

        try {
          const response = await get<SearchApiResponse>(`/things/search?${queryParams}`)

          if (response.results?.length) {
            const thingResults = response.results.map(item => ({
              id: item.id,
              title: item.name,
              content: item.description || '无描述',
              url: `/thing/${item.id}`,
              category: 'thing',
              isPublic: item.is_public,
              requireAuth: false, // 物品搜索不需要认证（后端已处理权限）
              thumbnail_url: item.thumbnail_url || null,
            }))

            allResults.push(...thingResults)
          }
        } catch (error) {
          console.error('物品搜索失败:', error)
          // 如果是认证错误，不显示错误信息，只是不返回结果
        }
      }

      setResults(allResults)
    } catch (error) {
      console.error('搜索出错:', error)
    } finally {
      setLoading(false)
      setHasSearched(true) // 标记已完成搜索
    }
  }, [searchTerm, activeCategory, isAuthenticated, t])

  // 自动搜索（防抖）
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchTerm.trim()) {
        performSearch()
      } else {
        setResults([])
        setHasSearched(false)
        lastSearchRef.current = {
          searchTerm: '',
          activeCategory,
        }
      }
    }, 500)

    return () => clearTimeout(delaySearch)
  }, [searchTerm, activeCategory, performSearch])

  return {
    results,
    loading,
    hasSearched,
    performSearch,
  }
}
