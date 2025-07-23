import { useState, useCallback, useEffect } from 'react'
import { useItemStore } from '@/app/thing/stores/itemStore'

interface UseThingSearchReturn {
  searchTerm: string
  setSearchTerm: (term: string) => void
  handleSearch: (term: string) => void
  isSearching: boolean
}

export function useThingSearch(): UseThingSearchReturn {
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const { fetchItems } = useItemStore()

  const handleSearch = useCallback(
    async (term: string) => {
      if (isSearching) return

      setIsSearching(true)
      try {
        await fetchItems({ search: term || undefined, page: 1 })

        // 更新URL
        const url = new URL(window.location.href)
        if (term) {
          url.searchParams.set('search', term)
        } else {
          url.searchParams.delete('search')
        }
        window.history.replaceState({}, '', url)
      } catch (error) {
        console.error('搜索失败:', error)
      } finally {
        setIsSearching(false)
      }
    },
    [fetchItems, isSearching]
  )

  // 监听自定义搜索事件
  useEffect(() => {
    const handleCustomSearch = (event: CustomEvent) => {
      const { searchTerm: newSearchTerm } = event.detail

      const normalizedCurrent = String(searchTerm || '').trim()
      const normalizedNew = String(newSearchTerm || '').trim()

      if (normalizedCurrent !== normalizedNew) {
        setSearchTerm(newSearchTerm)
        handleSearch(newSearchTerm)
      }
    }

    document.addEventListener('thing-search', handleCustomSearch as EventListener)

    return () => {
      document.removeEventListener('thing-search', handleCustomSearch as EventListener)
    }
  }, [searchTerm, handleSearch])

  // 监听URL变化
  useEffect(() => {
    const handleUrlChange = () => {
      const searchParams = new URLSearchParams(window.location.search)
      const search = searchParams.get('search')

      if (search && search !== searchTerm) {
        setSearchTerm(search)
        handleSearch(search)
      }
    }

    window.addEventListener('popstate', handleUrlChange)

    return () => {
      window.removeEventListener('popstate', handleUrlChange)
    }
  }, [searchTerm, handleSearch])

  return {
    searchTerm,
    setSearchTerm,
    handleSearch,
    isSearching,
  }
}
