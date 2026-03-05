import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useExpandedState } from '../useExpandedState'

const baseAreas = [
  { id: 1, name: '客厅' },
  { id: 2, name: '卧室' },
] as any

const baseRooms = [
  { id: 11, name: '主客厅', area_id: 1 },
  { id: 22, name: '主卧', area_id: 2 },
] as any

const baseSpots = [
  { id: 111, name: '沙发', room_id: 11 },
  { id: 222, name: '书桌', room_id: 22 },
] as any

afterEach(() => {
  vi.useRealTimers()
})

describe('useExpandedState edge cases', () => {
  it('does not expand/collapse when areas or rooms are empty', () => {
    vi.useFakeTimers()

    const { result, rerender } = renderHook(
      ({ isExpanded }) => useExpandedState(isExpanded, undefined, [], [], []),
      { initialProps: { isExpanded: false } }
    )

    rerender({ isExpanded: true })
    act(() => {
      vi.runAllTimers()
    })

    expect(result.current.expandedAreas.size).toBe(0)
    expect(result.current.expandedRooms.size).toBe(0)
  })

  it('does not change sets when selected room does not exist', () => {
    vi.useFakeTimers()

    const { result, rerender } = renderHook(
      ({ selected }) => useExpandedState(false, selected as any, baseAreas, baseRooms, baseSpots),
      { initialProps: { selected: undefined as any } }
    )

    rerender({ selected: { type: 'room', id: 999 } })
    act(() => {
      vi.runAllTimers()
    })

    expect(result.current.expandedAreas.size).toBe(0)
    expect(result.current.expandedRooms.size).toBe(0)
  })

  it('does not change sets when selected spot does not exist', () => {
    vi.useFakeTimers()

    const { result, rerender } = renderHook(
      ({ selected }) => useExpandedState(false, selected as any, baseAreas, baseRooms, baseSpots),
      { initialProps: { selected: undefined as any } }
    )

    rerender({ selected: { type: 'spot', id: 999 } })
    act(() => {
      vi.runAllTimers()
    })

    expect(result.current.expandedAreas.size).toBe(0)
    expect(result.current.expandedRooms.size).toBe(0)
  })

  it('adds spot.room_id to expandedRooms even when room cannot be resolved', () => {
    vi.useFakeTimers()

    const spotsWithUnknownRoom = [{ id: 333, name: '未知位置', room_id: 999 }] as any
    const { result, rerender } = renderHook(
      ({ selected }) =>
        useExpandedState(false, selected as any, baseAreas, baseRooms, spotsWithUnknownRoom),
      { initialProps: { selected: undefined as any } }
    )

    rerender({ selected: { type: 'spot', id: 333 } })
    act(() => {
      vi.runAllTimers()
    })

    expect(result.current.expandedAreas.size).toBe(0)
    expect(result.current.expandedRooms.has(999)).toBe(true)
  })

  it('keeps expandedRooms unchanged when selecting another spot in the same already-expanded room', () => {
    vi.useFakeTimers()

    const spotsInSameRoom = [
      { id: 111, name: '沙发', room_id: 11 },
      { id: 112, name: '地毯', room_id: 11 },
    ] as any

    const { result, rerender } = renderHook(
      ({ selected }) =>
        useExpandedState(false, selected as any, baseAreas, baseRooms, spotsInSameRoom),
      { initialProps: { selected: undefined as any } }
    )

    rerender({ selected: { type: 'spot', id: 111 } })
    act(() => {
      vi.runAllTimers()
    })

    rerender({ selected: { type: 'spot', id: 112 } })
    act(() => {
      vi.runAllTimers()
    })

    expect(result.current.expandedRooms.size).toBe(1)
    expect(result.current.expandedRooms.has(11)).toBe(true)
  })

  it('does not expand area/room when selected type is area', () => {
    vi.useFakeTimers()

    const { result, rerender } = renderHook(
      ({ selected }) => useExpandedState(false, selected as any, baseAreas, baseRooms, baseSpots),
      { initialProps: { selected: undefined as any } }
    )

    rerender({ selected: { type: 'area', id: 1 } })
    act(() => {
      vi.runAllTimers()
    })

    expect(result.current.expandedAreas.size).toBe(0)
    expect(result.current.expandedRooms.size).toBe(0)
  })
})
