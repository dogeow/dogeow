import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useDebounce, useSearchDebounce } from '../useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the updated value after the specified delay', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'first', delay: 500 },
    })

    expect(result.current).toBe('first')

    // change value
    rerender({ value: 'second', delay: 500 })
    expect(result.current).toBe('first')

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current).toBe('second')
  })
})

describe('useSearchDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('delays the query and reports searching status', () => {
    const { result, rerender } = renderHook(
      ({ q, delay, minLength }) => useSearchDebounce(q, delay, minLength),
      {
        initialProps: { q: '', delay: 300, minLength: 1 },
      }
    )

    expect(result.current.debouncedQuery).toBe('')
    expect(result.current.isSearching).toBe(false)

    // user types something
    rerender({ q: 'abc', delay: 300, minLength: 1 })
    expect(result.current.debouncedQuery).toBe('')
    expect(result.current.isSearching).toBe(true)

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current.debouncedQuery).toBe('abc')
    expect(result.current.isSearching).toBe(false)
    expect(result.current.hasQuery).toBe(true)

    // query below min length
    rerender({ q: 'a', delay: 300, minLength: 2 })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current.debouncedQuery).toBe('')
    expect(result.current.hasQuery).toBe(false)
  })
})
