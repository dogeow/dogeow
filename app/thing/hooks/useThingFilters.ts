import { useState, useCallback } from 'react'
import { FilterParams } from '@/app/thing/types'

interface UseThingFiltersReturn {
  filters: FilterParams
  updateFilters: (newFilters: Record<string, unknown>) => void
  clearFilters: () => void
  hasActiveFilters: () => boolean
  currentPage: number
  setCurrentPage: (page: number) => void
}

export function useThingFilters(): UseThingFiltersReturn {
  const [filters, setFilters] = useState<FilterParams>({})
  const [currentPage, setCurrentPage] = useState(1)

  const updateFilters = useCallback((newFilters: Record<string, unknown>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
    setCurrentPage(1)
  }, [])

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
