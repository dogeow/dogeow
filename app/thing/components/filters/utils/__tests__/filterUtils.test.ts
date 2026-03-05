import { describe, expect, it, vi } from 'vitest'
import { initialFilters, type FilterState } from '../../types'
import { applyFilters, getInitialFilterState, hasActiveFilters } from '../filterUtils'

describe('filterUtils', () => {
  it('applyFilters removes empty/all values and keeps allowed control fields', () => {
    const onApply = vi.fn()
    const filters: FilterState = {
      ...initialFilters,
      name: 'MacBook',
      status: 'all',
      category_id: 'all',
      price_from: '',
      is_public: false,
      include_null_purchase_date: true,
      include_null_expiry_date: false,
      exclude_null_purchase_date: true,
      exclude_null_expiry_date: true,
    }

    applyFilters(filters, onApply)

    expect(onApply).toHaveBeenCalledTimes(1)
    const payload = onApply.mock.calls[0][0] as FilterState
    expect(payload).toMatchObject({
      name: 'MacBook',
      is_public: false,
      include_null_purchase_date: true,
      include_null_expiry_date: false,
    })
    expect(payload).not.toHaveProperty('status')
    expect(payload).not.toHaveProperty('category_id')
    expect(payload).not.toHaveProperty('exclude_null_purchase_date')
    expect(payload).not.toHaveProperty('exclude_null_expiry_date')
  })

  it('applyFilters converts comma-separated tags into number array', () => {
    const onApply = vi.fn()
    const filters: FilterState = {
      ...initialFilters,
      tags: '1, 2, ,3',
    }

    applyFilters(filters, onApply)

    const payload = onApply.mock.calls[0][0] as FilterState
    expect(payload.tags).toEqual([1, 2, 3])
  })

  it('hasActiveFilters detects changed normal fields and date fields', () => {
    expect(hasActiveFilters(initialFilters)).toBe(false)

    expect(
      hasActiveFilters({
        ...initialFilters,
        name: '已修改',
      })
    ).toBe(true)

    expect(
      hasActiveFilters({
        ...initialFilters,
        purchase_date_from: new Date('2026-03-05T00:00:00.000Z'),
      })
    ).toBe(true)
  })

  it('getInitialFilterState returns initialFilters for empty input', () => {
    const result = getInitialFilterState({})
    expect(result).toBe(initialFilters)
  })

  it('getInitialFilterState merges known fields and parses date values', () => {
    const saved = {
      name: 'Keyboard',
      price_from: 100,
      purchase_date_from: '2026-03-01T00:00:00.000Z',
      unknown_key: 'ignored',
    }

    const result = getInitialFilterState(saved)

    expect(result.name).toBe('Keyboard')
    expect(result.price_from).toBe(100)
    expect(result.purchase_date_from).toBeInstanceOf(Date)
    expect((result.purchase_date_from as Date).toISOString()).toBe('2026-03-01T00:00:00.000Z')
    expect(result).not.toHaveProperty('unknown_key')
  })

  it('getInitialFilterState parses other date keys as Date objects', () => {
    const result = getInitialFilterState({
      purchase_date_to: '2026-03-02T00:00:00.000Z',
      expiry_date_from: '2026-03-03T00:00:00.000Z',
      expiry_date_to: '2026-03-04T00:00:00.000Z',
    })

    expect(result.purchase_date_to).toBeInstanceOf(Date)
    expect(result.expiry_date_from).toBeInstanceOf(Date)
    expect(result.expiry_date_to).toBeInstanceOf(Date)
    expect((result.expiry_date_to as Date).toISOString()).toBe('2026-03-04T00:00:00.000Z')
  })

  it('getInitialFilterState keeps default null when saved date value is falsy', () => {
    const result = getInitialFilterState({
      purchase_date_to: '',
      expiry_date_from: null,
    })

    expect(result.purchase_date_to).toBeNull()
    expect(result.expiry_date_from).toBeNull()
  })
})
