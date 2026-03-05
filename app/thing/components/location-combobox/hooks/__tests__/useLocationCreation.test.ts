import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useLocationCreation } from '../useLocationCreation'
import { apiRequest } from '@/lib/api'
import { toast } from 'sonner'

vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

afterEach(() => {
  vi.useRealTimers()
})

const baseAreas = [{ id: 1, name: '客厅' }] as any
const baseRooms = [{ id: 11, name: '主客厅', area_id: 1 }] as any
const baseSpots = [{ id: 111, name: '沙发', room_id: 11 }] as any

const createContext = (overrides?: Partial<{ selectedAreaId: string; selectedRoomId: string }>) => {
  const setAreas = vi.fn()
  const setRooms = vi.fn()
  const setSpots = vi.fn()
  const setSelectedAreaId = vi.fn()
  const setSelectedRoomId = vi.fn()
  const setSelectedSpotId = vi.fn()
  const handleSpotSelect = vi.fn()

  const selectedAreaId = overrides?.selectedAreaId ?? '1'
  const selectedRoomId = overrides?.selectedRoomId ?? '11'

  const { result } = renderHook(() =>
    useLocationCreation(
      baseAreas,
      baseRooms,
      baseSpots,
      selectedAreaId,
      selectedRoomId,
      setAreas,
      setRooms,
      setSpots,
      setSelectedAreaId,
      setSelectedRoomId,
      setSelectedSpotId,
      handleSpotSelect
    )
  )

  return {
    hook: result.current,
    setAreas,
    setRooms,
    setSpots,
    setSelectedAreaId,
    setSelectedRoomId,
    setSelectedSpotId,
    handleSpotSelect,
  }
}

describe('useLocationCreation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create area successfully', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      message: 'ok',
      area: { id: 2, name: '厨房' },
    } as any)

    const ctx = createContext()
    const area = await ctx.hook.handleCreateArea('厨房')

    expect(area).toEqual({ id: 2, name: '厨房' })
    expect(apiRequest).toHaveBeenCalledWith('/areas', 'POST', { name: '厨房' })
    expect(ctx.setSelectedAreaId).toHaveBeenCalledWith('2')
    expect(toast.success).toHaveBeenCalledWith('已创建区域 "厨房"')

    const updater = ctx.setAreas.mock.calls[0][0] as (prev: any[]) => any[]
    expect(updater([{ id: 1, name: '客厅' }])).toEqual([
      { id: 1, name: '客厅' },
      { id: 2, name: '厨房' },
    ])
  })

  it('should return null when created area response is invalid', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({ message: 'ok', area: {} } as any)

    const ctx = createContext()
    const area = await ctx.hook.handleCreateArea('厨房')

    expect(area).toBeNull()
    expect(toast.error).toHaveBeenCalled()
  })

  it('should require selected area before creating room', async () => {
    const ctx = createContext({ selectedAreaId: '' })

    const room = await ctx.hook.handleCreateRoom('书房')

    expect(room).toBeNull()
    expect(apiRequest).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith('请先选择区域')
  })

  it('should create room successfully', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      message: 'ok',
      room: { id: 22, name: '书房', area_id: 1 },
    } as any)

    const ctx = createContext({ selectedAreaId: '1' })
    const room = await ctx.hook.handleCreateRoom('书房')

    expect(room).toEqual({ id: 22, name: '书房', area_id: 1 })
    expect(apiRequest).toHaveBeenCalledWith('/rooms', 'POST', {
      name: '书房',
      area_id: 1,
    })
    expect(ctx.setSelectedRoomId).toHaveBeenCalledWith('22')
    expect(toast.success).toHaveBeenCalledWith('已创建房间 "书房"')

    const updater = ctx.setRooms.mock.calls[0][0] as (prev: any[]) => any[]
    expect(updater([{ id: 11, name: '主客厅', area_id: 1 }])).toEqual([
      { id: 11, name: '主客厅', area_id: 1 },
      { id: 22, name: '书房', area_id: 1 },
    ])
  })

  it('should return null when created room response is invalid', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({ message: 'ok', room: {} } as any)

    const ctx = createContext({ selectedAreaId: '1' })
    const room = await ctx.hook.handleCreateRoom('书房')

    expect(room).toBeNull()
    expect(toast.error).toHaveBeenCalled()
  })

  it('should require selected room before creating spot', async () => {
    const ctx = createContext({ selectedRoomId: '' })

    const spot = await ctx.hook.handleCreateSpot('电视柜')

    expect(spot).toBeNull()
    expect(apiRequest).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith('请先选择房间')
  })

  it('should create spot successfully and trigger select callback', async () => {
    vi.useFakeTimers()

    vi.mocked(apiRequest).mockResolvedValueOnce({
      message: 'ok',
      spot: { id: 333, name: '电视柜', room_id: 11 },
    } as any)

    const ctx = createContext({ selectedRoomId: '11' })
    const spot = await ctx.hook.handleCreateSpot('电视柜')

    expect(spot).toEqual({ id: 333, name: '电视柜', room_id: 11 })
    expect(apiRequest).toHaveBeenCalledWith('/spots', 'POST', {
      name: '电视柜',
      room_id: 11,
    })
    expect(ctx.setSelectedSpotId).toHaveBeenCalledWith('333')

    const updater = ctx.setSpots.mock.calls[0][0] as (prev: any[]) => any[]
    expect(updater([{ id: 111, name: '沙发', room_id: 11 }])).toEqual([
      { id: 111, name: '沙发', room_id: 11 },
      { id: 333, name: '电视柜', room_id: 11 },
    ])

    vi.runAllTimers()
    expect(ctx.handleSpotSelect).toHaveBeenCalledWith('333')
    expect(toast.success).toHaveBeenCalledWith('已创建位置 "电视柜"')
  })

  it('should return null when created spot response is invalid', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({ message: 'ok', spot: {} } as any)

    const ctx = createContext({ selectedRoomId: '11' })
    const spot = await ctx.hook.handleCreateSpot('电视柜')

    expect(spot).toBeNull()
    expect(toast.error).toHaveBeenCalled()
  })

  it('should handle create room and spot failures', async () => {
    vi.mocked(apiRequest).mockRejectedValueOnce(new Error('room fail'))

    const ctx1 = createContext({ selectedAreaId: '1' })
    const room = await ctx1.hook.handleCreateRoom('书房')
    expect(room).toBeNull()
    expect(toast.error).toHaveBeenCalled()

    vi.mocked(apiRequest).mockRejectedValueOnce(new Error('spot fail'))

    const ctx2 = createContext({ selectedRoomId: '11' })
    const spot = await ctx2.hook.handleCreateSpot('电视柜')
    expect(spot).toBeNull()
    expect(toast.error).toHaveBeenCalled()
  })

  it('should surface unknown error message when rejection is not an Error instance', async () => {
    vi.mocked(apiRequest).mockRejectedValueOnce('bad-area')
    vi.mocked(apiRequest).mockRejectedValueOnce({ reason: 'bad-room' } as any)
    vi.mocked(apiRequest).mockRejectedValueOnce(500 as any)

    const ctx = createContext({ selectedAreaId: '1', selectedRoomId: '11' })

    expect(await ctx.hook.handleCreateArea('阳台')).toBeNull()
    expect(await ctx.hook.handleCreateRoom('储物间')).toBeNull()
    expect(await ctx.hook.handleCreateSpot('窗边')).toBeNull()

    expect(toast.error).toHaveBeenCalledWith('创建区域失败：未知错误')
    expect(toast.error).toHaveBeenCalledWith('创建房间失败：未知错误')
    expect(toast.error).toHaveBeenCalledWith('创建位置失败：未知错误')
  })
})
