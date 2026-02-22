import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { usePagination } from '../usePagination'

describe('usePagination', () => {
  it('initializes with default page', () => {
    const { result } = renderHook(() => usePagination())
    expect(result.current.currentPage).toBe(1)
  })

  it('accepts initialPage param', () => {
    const { result } = renderHook(() => usePagination(5))
    expect(result.current.currentPage).toBe(5)
  })

  it('setPage updates page', () => {
    const { result } = renderHook(() => usePagination())
    act(() => result.current.setPage(3))
    expect(result.current.currentPage).toBe(3)
  })

  it('goNext and goPrev work correctly and do not go below initial', () => {
    const { result } = renderHook(() => usePagination(2))
    act(() => result.current.goNext())
    expect(result.current.currentPage).toBe(3)
    act(() => result.current.goPrev())
    expect(result.current.currentPage).toBe(2)
    act(() => result.current.goPrev())
    expect(result.current.currentPage).toBe(2)
  })

  it('reset returns to initial value', () => {
    const { result } = renderHook(() => usePagination(4))
    act(() => {
      result.current.setPage(10)
      result.current.reset()
    })
    expect(result.current.currentPage).toBe(4)
  })
})
