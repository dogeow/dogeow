import { describe, expect, it, vi } from 'vitest'
import { applyFilters, getInitialFilterState, hasActiveFilters } from '../filters/utils/filterUtils'
import { initialFilters, type FilterState } from '../filters/types'

describe('filters/utils/filterUtils', () => {
  it('applyFilters strips empty defaults, keeps special flags, and converts tag string', () => {
    const onApply = vi.fn()
    const filters: FilterState = {
      ...initialFilters,
      name: '牙刷',
      status: 'active',
      tags: '1, 2,3',
      category_id: 'all',
      is_public: false,
      include_null_purchase_date: true,
      exclude_null_purchase_date: true,
      exclude_null_expiry_date: true,
    }

    applyFilters(filters, onApply)

    const applied = onApply.mock.calls[0][0] as FilterState
    expect(applied).toMatchObject({
      name: '牙刷',
      status: 'active',
      tags: [1, 2, 3],
      is_public: false,
      include_null_purchase_date: true,
      include_null_expiry_date: false,
    })
    expect(applied).not.toHaveProperty('category_id')
    expect(applied).not.toHaveProperty('exclude_null_purchase_date')
    expect(applied).not.toHaveProperty('exclude_null_expiry_date')
  })

  it('hasActiveFilters detects date and non-date field changes', () => {
    expect(hasActiveFilters(initialFilters)).toBe(false)
    expect(
      hasActiveFilters({
        ...initialFilters,
        purchase_date_from: new Date('2024-01-01'),
      })
    ).toBe(true)
    expect(
      hasActiveFilters({
        ...initialFilters,
        name: '关键字',
      })
    ).toBe(true)
  })

  it('getInitialFilterState returns defaults when empty', () => {
    expect(getInitialFilterState({})).toEqual(initialFilters)
  })

  it('getInitialFilterState converts known date keys and merges normal values', () => {
    const result = getInitialFilterState({
      name: '旧筛选',
      status: 'idle',
      purchase_date_from: '2024-01-01T00:00:00.000Z',
      purchase_date_to: '2024-02-01T00:00:00.000Z',
      expiry_date_from: '2024-03-01T00:00:00.000Z',
      expiry_date_to: '2024-04-01T00:00:00.000Z',
      include_null_expiry_date: true,
      unknown_key: 'ignored',
    })

    expect(result.name).toBe('旧筛选')
    expect(result.status).toBe('idle')
    expect(result.include_null_expiry_date).toBe(true)
    expect(result.purchase_date_from).toBeInstanceOf(Date)
    expect(result.purchase_date_to).toBeInstanceOf(Date)
    expect(result.expiry_date_from).toBeInstanceOf(Date)
    expect(result.expiry_date_to).toBeInstanceOf(Date)
    expect(result).not.toHaveProperty('unknown_key')
  })

  it('getInitialFilterState keeps null defaults when saved date is falsy', () => {
    const result = getInitialFilterState({
      purchase_date_from: '',
      expiry_date_to: null,
    })
    expect(result.purchase_date_from).toBeNull()
    expect(result.expiry_date_to).toBeNull()
  })
})
