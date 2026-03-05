import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useExpandedState } from '../useExpandedState'

const areas = [
  { id: 1, name: '客厅' },
  { id: 2, name: '卧室' },
] as any

const rooms = [
  { id: 11, name: '主客厅', area_id: 1 },
  { id: 22, name: '主卧', area_id: 2 },
] as any

const spots = [
  { id: 111, name: '沙发', room_id: 11 },
  { id: 222, name: '书桌', room_id: 22 },
] as any

afterEach(() => {
  vi.useRealTimers()
})

describe('useExpandedState', () => {
  it('should initialize with empty expanded sets', () => {
    const { result } = renderHook(() => useExpandedState(false, undefined, areas, rooms, spots))

    expect(result.current.expandedAreas.size).toBe(0)
    expect(result.current.expandedRooms.size).toBe(0)
  })

  it('should toggle area and room state', () => {
    const { result } = renderHook(() => useExpandedState(false, undefined, areas, rooms, spots))

    act(() => {
      result.current.toggleArea(1)
      result.current.toggleRoom(11)
    })

    expect(result.current.expandedAreas.has(1)).toBe(true)
    expect(result.current.expandedRooms.has(11)).toBe(true)

    act(() => {
      result.current.toggleArea(1)
      result.current.toggleRoom(11)
    })

    expect(result.current.expandedAreas.has(1)).toBe(false)
    expect(result.current.expandedRooms.has(11)).toBe(false)
  })

  it('should expand all when isExpanded changes to true', () => {
    vi.useFakeTimers()

    const { result, rerender } = renderHook(
      ({ isExpanded }) => useExpandedState(isExpanded, undefined, areas, rooms, spots),
      { initialProps: { isExpanded: false } }
    )

    rerender({ isExpanded: true })

    act(() => {
      vi.runAllTimers()
    })

    expect(Array.from(result.current.expandedAreas)).toEqual([1, 2])
    expect(Array.from(result.current.expandedRooms)).toEqual([11, 22])
  })

  it('should collapse all when isExpanded changes to false', () => {
    vi.useFakeTimers()

    const { result, rerender } = renderHook(
      ({ isExpanded }) => useExpandedState(isExpanded, undefined, areas, rooms, spots),
      { initialProps: { isExpanded: true } }
    )

    rerender({ isExpanded: false })

    act(() => {
      vi.runAllTimers()
    })

    expect(result.current.expandedAreas.size).toBe(0)
    expect(result.current.expandedRooms.size).toBe(0)
  })

  it('should expand parent area for selected room', () => {
    vi.useFakeTimers()

    const { result, rerender } = renderHook(
      ({ selected }) => useExpandedState(false, selected as any, areas, rooms, spots),
      { initialProps: { selected: undefined as any } }
    )

    rerender({ selected: { type: 'room', id: 11 } })

    act(() => {
      vi.runAllTimers()
    })

    expect(result.current.expandedAreas.has(1)).toBe(true)
  })

  it('should expand parent area and room for selected spot', () => {
    vi.useFakeTimers()

    const { result, rerender } = renderHook(
      ({ selected }) => useExpandedState(false, selected as any, areas, rooms, spots),
      { initialProps: { selected: undefined as any } }
    )

    rerender({ selected: { type: 'spot', id: 111 } })

    act(() => {
      vi.runAllTimers()
    })

    expect(result.current.expandedAreas.has(1)).toBe(true)
    expect(result.current.expandedRooms.has(11)).toBe(true)
  })

  it('should keep state unchanged when selected location does not change', () => {
    vi.useFakeTimers()

    const { result, rerender } = renderHook(
      ({ selected }) => useExpandedState(false, selected as any, areas, rooms, spots),
      { initialProps: { selected: { type: 'spot', id: 111 } as any } }
    )

    act(() => {
      vi.runAllTimers()
    })

    const firstAreas = Array.from(result.current.expandedAreas)
    const firstRooms = Array.from(result.current.expandedRooms)

    rerender({ selected: { type: 'spot', id: 111 } })

    act(() => {
      vi.runAllTimers()
    })

    expect(Array.from(result.current.expandedAreas)).toEqual(firstAreas)
    expect(Array.from(result.current.expandedRooms)).toEqual(firstRooms)
  })
})
