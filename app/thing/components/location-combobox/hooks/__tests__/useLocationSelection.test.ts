import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocationSelection } from '../useLocationSelection'

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

describe('useLocationSelection', () => {
  it('should initialize empty selection when selectedLocation is undefined', () => {
    const { result } = renderHook(() => useLocationSelection(undefined, areas, rooms, spots))

    expect(result.current.selectedAreaId).toBe('')
    expect(result.current.selectedRoomId).toBe('')
    expect(result.current.selectedSpotId).toBe('')
  })

  it('should set area selection from selectedLocation area', () => {
    const { result } = renderHook(() =>
      useLocationSelection({ type: 'area', id: 1 }, areas, rooms, spots)
    )

    expect(result.current.selectedAreaId).toBe('1')
    expect(result.current.selectedRoomId).toBe('')
    expect(result.current.selectedSpotId).toBe('')
  })

  it('should set area and room from selectedLocation room', () => {
    const { result } = renderHook(() =>
      useLocationSelection({ type: 'room', id: 11 }, areas, rooms, spots)
    )

    expect(result.current.selectedAreaId).toBe('1')
    expect(result.current.selectedRoomId).toBe('11')
    expect(result.current.selectedSpotId).toBe('')
  })

  it('should set area, room and spot from selectedLocation spot', () => {
    const { result } = renderHook(() =>
      useLocationSelection({ type: 'spot', id: 111 }, areas, rooms, spots)
    )

    expect(result.current.selectedAreaId).toBe('1')
    expect(result.current.selectedRoomId).toBe('11')
    expect(result.current.selectedSpotId).toBe('111')
  })

  it('should clear local selection when external selection becomes undefined', () => {
    const { result, rerender } = renderHook(
      ({ selected }) => useLocationSelection(selected as any, areas, rooms, spots),
      { initialProps: { selected: { type: 'spot', id: 111 } as any } }
    )

    expect(result.current.selectedSpotId).toBe('111')

    rerender({ selected: undefined as any })

    expect(result.current.selectedAreaId).toBe('')
    expect(result.current.selectedRoomId).toBe('')
    expect(result.current.selectedSpotId).toBe('')
  })

  it('should update selection by handlers', () => {
    const { result } = renderHook(() => useLocationSelection(undefined, areas, rooms, spots))

    act(() => {
      result.current.handleAreaChange('1')
    })

    expect(result.current.selectedAreaId).toBe('1')
    expect(result.current.selectedRoomId).toBe('')
    expect(result.current.selectedSpotId).toBe('')

    act(() => {
      result.current.handleRoomChange('11')
    })

    expect(result.current.selectedRoomId).toBe('11')
    expect(result.current.selectedSpotId).toBe('')

    act(() => {
      result.current.handleSpotChange('111')
    })

    expect(result.current.selectedSpotId).toBe('111')
  })

  it('should ignore unknown room/spot ids from selectedLocation', () => {
    const { result } = renderHook(() =>
      useLocationSelection({ type: 'room', id: 999 }, areas, rooms, spots)
    )

    expect(result.current.selectedAreaId).toBe('')
    expect(result.current.selectedRoomId).toBe('')

    const { result: spotResult } = renderHook(() =>
      useLocationSelection({ type: 'spot', id: 999 }, areas, rooms, spots)
    )

    expect(spotResult.current.selectedAreaId).toBe('')
    expect(spotResult.current.selectedRoomId).toBe('')
    expect(spotResult.current.selectedSpotId).toBe('')
  })

  it('should ignore selected spot when room cannot be resolved from spots', () => {
    const spotsWithUnknownRoom = [{ id: 333, name: '未知位置', room_id: 999 }] as any
    const { result } = renderHook(() =>
      useLocationSelection({ type: 'spot', id: 333 }, areas, rooms, spotsWithUnknownRoom)
    )

    expect(result.current.selectedAreaId).toBe('')
    expect(result.current.selectedRoomId).toBe('')
    expect(result.current.selectedSpotId).toBe('')
  })

  it('should not mutate state when previous external selection existed but local state is already empty', () => {
    const spotsWithUnknownRoom = [{ id: 333, name: '未知位置', room_id: 999 }] as any
    const { result, rerender } = renderHook(
      ({ selected }) => useLocationSelection(selected as any, areas, rooms, spotsWithUnknownRoom),
      { initialProps: { selected: { type: 'spot', id: 333 } as any } }
    )

    expect(result.current.selectedAreaId).toBe('')
    expect(result.current.selectedRoomId).toBe('')
    expect(result.current.selectedSpotId).toBe('')

    rerender({ selected: undefined as any })

    expect(result.current.selectedAreaId).toBe('')
    expect(result.current.selectedRoomId).toBe('')
    expect(result.current.selectedSpotId).toBe('')
  })
})
