import { useState, useCallback } from 'react'

export interface UsePaginationReturn {
  currentPage: number
  setPage: (page: number) => void
  reset: () => void
  goNext: () => void
  goPrev: () => void
}

/**
 * Small reusable pagination state helper.
 *
 * Tracks a current page number and exposes convenience methods
 * for incrementing, decrementing and resetting back to the initial
 * value. No UI or data fetching is prescribed; those responsibilities
 * remain with callers.
 */
export function usePagination(initialPage = 1): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(initialPage)

  const setPage = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const reset = useCallback(() => {
    setCurrentPage(initialPage)
  }, [initialPage])

  const goNext = useCallback(() => {
    setCurrentPage(prev => prev + 1)
  }, [])

  const goPrev = useCallback(() => {
    setCurrentPage(prev => Math.max(initialPage, prev - 1))
  }, [initialPage])

  return { currentPage, setPage, reset, goNext, goPrev }
}
