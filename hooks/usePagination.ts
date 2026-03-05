import { useState, useCallback } from 'react'

export interface UsePaginationReturn {
  currentPage: number
  setPage: (page: number) => void
  reset: () => void
  goNext: () => void
  goPrev: () => void
}

const toSafeInteger = (value: number, fallback: number): number => {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return Math.trunc(value)
}

const normalizePage = (page: number, minPage: number): number => {
  return Math.max(minPage, toSafeInteger(page, minPage))
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
  const minPage = Math.max(1, toSafeInteger(initialPage, 1))
  const [currentPage, setCurrentPage] = useState(minPage)

  const setPage = useCallback(
    (page: number) => {
      setCurrentPage(normalizePage(page, minPage))
    },
    [minPage]
  )

  const reset = useCallback(() => {
    setCurrentPage(minPage)
  }, [minPage])

  const goNext = useCallback(() => {
    setCurrentPage(prev => normalizePage(prev + 1, minPage))
  }, [minPage])

  const goPrev = useCallback(() => {
    setCurrentPage(prev => Math.max(minPage, normalizePage(prev, minPage) - 1))
  }, [minPage])

  return { currentPage, setPage, reset, goNext, goPrev }
}
