import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTileManagement } from '../useTileManagement'

const { mockPush, mockRequireLogin, mockUseRouter, mockUseLoginTrigger, mockUseProjectCoverStore } =
  vi.hoisted(() => {
    const mockPush = vi.fn()
    const mockRequireLogin = vi.fn((callback?: () => void) => callback?.())

    return {
      mockPush,
      mockRequireLogin,
      mockUseRouter: vi.fn(() => ({
        push: mockPush,
      })),
      mockUseLoginTrigger: vi.fn(() => ({
        requireLogin: mockRequireLogin,
        isAuthenticated: false,
      })),
      mockUseProjectCoverStore: vi.fn(() => ({
        projectCoverMode: 'color' as const,
      })),
    }
  })

vi.mock('next/navigation', () => ({
  useRouter: mockUseRouter,
}))

vi.mock('@/app/configs', () => ({
  configs: {
    tiles: [
      {
        name: 'thing',
        nameKey: 'nav.thing',
        href: '/thing',
        color: '#2196F3',
        needLogin: true,
      },
      {
        name: 'lab',
        nameKey: 'nav.lab',
        href: '/lab',
        color: '#388e3c',
        needLogin: false,
      },
    ],
  },
}))

vi.mock('@/stores/projectCoverStore', () => ({
  useProjectCoverStore: mockUseProjectCoverStore,
}))

vi.mock('@/hooks/useLoginTrigger', () => ({
  useLoginTrigger: mockUseLoginTrigger,
}))

describe('useTileManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPush.mockReset()
    mockRequireLogin.mockReset()
    mockRequireLogin.mockImplementation((callback?: () => void) => callback?.())
    mockUseRouter.mockImplementation(() => ({ push: mockPush }))
    mockUseLoginTrigger.mockReturnValue({
      requireLogin: mockRequireLogin,
      isAuthenticated: false,
    })
    mockUseProjectCoverStore.mockReturnValue({
      projectCoverMode: 'color',
    })
  })

  it('returns tiles and the current cover mode from store', () => {
    const { result } = renderHook(() => useTileManagement())

    expect(result.current.tiles).toHaveLength(2)
    expect(result.current.projectCoverMode).toBe('color')
  })

  it('marks protected tiles as needing login when unauthenticated', () => {
    const { result } = renderHook(() => useTileManagement())

    expect(result.current.getTileStatus(result.current.tiles[0])).toMatchObject({
      isProtected: true,
      needsLogin: true,
      isActive: false,
    })
  })

  it('marks public tiles as active', () => {
    const { result } = renderHook(() => useTileManagement())

    expect(result.current.getTileStatus(result.current.tiles[1])).toMatchObject({
      isProtected: false,
      needsLogin: false,
      isActive: true,
    })
  })

  it('navigates directly for public tiles', () => {
    const { result } = renderHook(() => useTileManagement())

    act(() => {
      result.current.handleTileClick(result.current.tiles[1])
    })

    expect(mockPush).toHaveBeenCalledWith('/lab')
  })

  it('delegates protected navigation to requireLogin', () => {
    const { result } = renderHook(() => useTileManagement())

    act(() => {
      result.current.handleTileClick(result.current.tiles[0])
    })

    expect(mockRequireLogin).toHaveBeenCalledTimes(1)
  })
})
