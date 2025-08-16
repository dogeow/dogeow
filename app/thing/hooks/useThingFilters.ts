import { useState, useCallback, useEffect } from 'react'
import { FilterParams } from '@/app/thing/types'
import { useFilterPersistenceStore } from '@/app/thing/stores/filterPersistenceStore'

interface UseThingFiltersReturn {
  filters: FilterParams
  updateFilters: (newFilters: Record<string, unknown>) => void
  clearFilters: () => void
  hasActiveFilters: () => boolean
  currentPage: number
  setCurrentPage: (page: number) => void
}

export function useThingFilters(): UseThingFiltersReturn {
  const {
    savedFilters,
    saveFilters,
    clearFilters: clearPersistedFilters,
  } = useFilterPersistenceStore()
  const [filters, setFilters] = useState<FilterParams>(savedFilters)
  const [currentPage, setCurrentPage] = useState(1)

  // 当持久化的筛选条件变化时，更新本地状态
  useEffect(() => {
    console.log('useThingFilters: 持久化筛选条件更新:', savedFilters)
    setFilters(savedFilters)
  }, [savedFilters])

  const updateFilters = useCallback(
    (newFilters: Record<string, unknown>) => {
      console.log('useThingFilters: 更新筛选条件:', newFilters)
      const updatedFilters = { ...filters, ...newFilters }
      setFilters(updatedFilters)
      // 保存到持久化 store
      saveFilters(updatedFilters)
    },
    [filters, saveFilters]
  )

  const clearFilters = useCallback(() => {
    console.log('useThingFilters: 清除筛选条件')
    setFilters({})
    setCurrentPage(1)
    // 清除持久化的筛选条件
    clearPersistedFilters()
  }, [clearPersistedFilters])

  const hasActiveFilters = useCallback(() => {
    const activeFilters = Object.entries(filters).filter(([key, value]) => {
      if (
        value === undefined ||
        value === null ||
        value === '' ||
        value === 'all' ||
        (Array.isArray(value) && value.length === 0) ||
        (key === 'include_null_purchase_date' && value === true) ||
        (key === 'include_null_expiry_date' && value === true)
      ) {
        return false
      }

      if (key === 'category_id' && (value === 'none' || value === '')) {
        return false
      }

      return true
    })

    return activeFilters.length > 0
  }, [filters])

  return {
    filters,
    updateFilters,
    clearFilters,
    hasActiveFilters,
    currentPage,
    setCurrentPage,
  }
}
