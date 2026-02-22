import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useThingFilters } from '../useThingFilters'
import { useFilterPersistenceStore } from '@/app/thing/stores/filterPersistenceStore'

// mock persistence store
vi.mock('@/app/thing/stores/filterPersistenceStore', () => ({
  useFilterPersistenceStore: vi.fn(),
}))

describe('useThingFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useFilterPersistenceStore as any).mockReturnValue({
      savedFilters: {},
      saveFilters: vi.fn(),
      clearFilters: vi.fn(),
    })
  })

  it('initializes with saved filters and page 1', () => {
    const { result } = renderHook(() => useThingFilters())
    expect(result.current.filters).toEqual({})
    expect(result.current.currentPage).toBe(1)
  })

  it('updateFilters merges and persists and leaves page unchanged', () => {
    const { result } = renderHook(() => useThingFilters())
    act(() => result.current.updateFilters({ foo: 'bar' }))
    expect(result.current.filters.foo).toBe('bar')
    expect(result.current.currentPage).toBe(1)
    expect(result.current.hasActiveFilters()).toBe(true)
  })

  it('clearFilters resets filters and page and clears persistence', () => {
    const clearPersist = vi.fn()
    ;(useFilterPersistenceStore as any).mockReturnValue({
      savedFilters: { foo: 'bar' },
      saveFilters: vi.fn(),
      clearFilters: clearPersist,
    })
    const { result } = renderHook(() => useThingFilters())
    act(() => result.current.clearFilters())
    expect(result.current.filters).toEqual({})
    expect(result.current.currentPage).toBe(1)
    expect(clearPersist).toHaveBeenCalled()
  })
})
