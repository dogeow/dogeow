import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocationData } from '../useLocationData'
import { apiRequest } from '@/lib/api'
import { toast } from 'sonner'

vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}))

describe('useLocationData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with empty data', () => {
    const { result } = renderHook(() => useLocationData())

    expect(result.current.areas).toEqual([])
    expect(result.current.rooms).toEqual([])
    expect(result.current.spots).toEqual([])
    expect(result.current.loading).toBe(false)
  })

  it('should load areas successfully', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce([{ id: 1, name: '客厅' }] as any)

    const { result } = renderHook(() => useLocationData())

    await act(async () => {
      await result.current.loadAreas()
    })

    expect(apiRequest).toHaveBeenCalledWith('/areas')
    expect(result.current.areas).toEqual([{ id: 1, name: '客厅' }])
    expect(result.current.loading).toBe(false)
  })

  it('should handle load areas failure', async () => {
    vi.mocked(apiRequest).mockRejectedValueOnce(new Error('network error'))

    const { result } = renderHook(() => useLocationData())

    await act(async () => {
      await result.current.loadAreas()
    })

    expect(toast.error).toHaveBeenCalledWith('加载区域失败')
    expect(result.current.loading).toBe(false)
  })

  it('should clear rooms when areaId is empty', async () => {
    const { result } = renderHook(() => useLocationData())

    act(() => {
      result.current.setRooms([{ id: 11, name: '主客厅', area_id: 1 }] as any)
    })

    await act(async () => {
      await result.current.loadRooms('')
    })

    expect(result.current.rooms).toEqual([])
  })

  it('should load rooms successfully', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce([{ id: 11, name: '主客厅', area_id: 1 }] as any)

    const { result } = renderHook(() => useLocationData())

    await act(async () => {
      await result.current.loadRooms('1')
    })

    expect(apiRequest).toHaveBeenCalledWith('/areas/1/rooms')
    expect(result.current.rooms).toEqual([{ id: 11, name: '主客厅', area_id: 1 }])
  })

  it('should handle load rooms failure', async () => {
    vi.mocked(apiRequest).mockRejectedValueOnce(new Error('network error'))

    const { result } = renderHook(() => useLocationData())

    await act(async () => {
      await result.current.loadRooms('1')
    })

    expect(toast.error).toHaveBeenCalledWith('加载房间失败')
  })

  it('should clear spots when roomId is empty', async () => {
    const { result } = renderHook(() => useLocationData())

    act(() => {
      result.current.setSpots([{ id: 111, name: '沙发', room_id: 11 }] as any)
    })

    await act(async () => {
      await result.current.loadSpots('')
    })

    expect(result.current.spots).toEqual([])
  })

  it('should load spots successfully', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce([{ id: 111, name: '沙发', room_id: 11 }] as any)

    const { result } = renderHook(() => useLocationData())

    await act(async () => {
      await result.current.loadSpots('11')
    })

    expect(apiRequest).toHaveBeenCalledWith('/rooms/11/spots')
    expect(result.current.spots).toEqual([{ id: 111, name: '沙发', room_id: 11 }])
  })

  it('should handle load spots failure', async () => {
    vi.mocked(apiRequest).mockRejectedValueOnce(new Error('network error'))

    const { result } = renderHook(() => useLocationData())

    await act(async () => {
      await result.current.loadSpots('11')
    })

    expect(toast.error).toHaveBeenCalledWith('加载位置失败')
  })
})
