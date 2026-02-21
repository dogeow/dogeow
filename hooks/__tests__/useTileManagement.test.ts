import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTileManagement } from '../useTileManagement'

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
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
  useProjectCoverStore: vi.fn(() => ({
    showProjectCovers: false,
  })),
}))

vi.mock('@/hooks/useLoginTrigger', () => ({
  useLoginTrigger: vi.fn(() => ({
    requireLogin: vi.fn(callback => callback()),
    isAuthenticated: false,
  })),
}))

describe('useTileManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should return tiles from configs', () => {
      const { result } = renderHook(() => useTileManagement())

      expect(result.current.tiles).toHaveLength(2)
      expect(result.current.tiles[0].name).toBe('thing')
      expect(result.current.tiles[1].name).toBe('lab')
    })

    it('should return showProjectCovers from store', () => {
      const { result } = renderHook(() => useTileManagement())

      expect(result.current.showProjectCovers).toBe(false)
    })

    it('should return isAuthenticated from login trigger', () => {
      const { result } = renderHook(() => useTileManagement())

      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('Tile Protection', () => {
    it('should identify protected tiles correctly', () => {
      const { result } = renderHook(() => useTileManagement())

      const protectedTile = result.current.tiles[0] // thing tile
      const publicTile = result.current.tiles[1] // lab tile

      expect(result.current.getTileStatus(protectedTile).isProtected).toBe(true)
      expect(result.current.getTileStatus(publicTile).isProtected).toBe(false)
    })

    it('should identify tiles that need login', () => {
      const { result } = renderHook(() => useTileManagement())

      const protectedTile = result.current.tiles[0] // thing tile
      const publicTile = result.current.tiles[1] // lab tile

      expect(result.current.getTileStatus(protectedTile).needsLogin).toBe(true)
      expect(result.current.getTileStatus(publicTile).needsLogin).toBe(false)
    })

    it('should identify active tiles correctly', () => {
      const { result } = renderHook(() => useTileManagement())

      const protectedTile = result.current.tiles[0] // thing tile
      const publicTile = result.current.tiles[1] // lab tile

      expect(result.current.getTileStatus(protectedTile).isActive).toBe(false)
      expect(result.current.getTileStatus(publicTile).isActive).toBe(true)
    })
  })

  describe('Tile Click Handling', () => {
    it('should handle click on public tile', () => {
      const mockPush = vi.fn()
      const { useRouter } = require('next/navigation')
      vi.mocked(useRouter).mockImplementation(() => ({ push: mockPush }))

      const { result } = renderHook(() => useTileManagement())

      const publicTile = result.current.tiles[1] // lab tile

      act(() => {
        result.current.handleTileClick(publicTile)
      })

      expect(mockPush).toHaveBeenCalledWith('/lab')
    })

    it('should handle click on protected tile when authenticated', () => {
      const mockPush = vi.fn()
      const { useRouter } = require('next/navigation')
      vi.mocked(useRouter).mockImplementation(() => ({ push: mockPush }))

      const { useLoginTrigger } = require('@/hooks/useLoginTrigger')
      vi.mocked(useLoginTrigger).mockReturnValue({
        requireLogin: vi.fn(callback => callback()),
        isAuthenticated: true,
      })

      const { result } = renderHook(() => useTileManagement())

      const protectedTile = result.current.tiles[0] // thing tile

      act(() => {
        result.current.handleTileClick(protectedTile)
      })

      expect(mockPush).toHaveBeenCalledWith('/thing')
    })

    it('should require login for protected tile when not authenticated', () => {
      const mockRequireLogin = vi.fn()
      const { useLoginTrigger } = require('@/hooks/useLoginTrigger')
      vi.mocked(useLoginTrigger).mockReturnValue({
        requireLogin: mockRequireLogin,
        isAuthenticated: false,
      })

      const { result } = renderHook(() => useTileManagement())

      const protectedTile = result.current.tiles[0] // thing tile

      act(() => {
        result.current.handleTileClick(protectedTile)
      })

      expect(mockRequireLogin).toHaveBeenCalled()
    })

    it('should handle navigation errors gracefully', () => {
      const mockPush = vi.fn(() => {
        throw new Error('Navigation failed')
      })
      const { useRouter } = require('next/navigation')
      vi.mocked(useRouter).mockImplementation(() => ({ push: mockPush }))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useTileManagement())

      const publicTile = result.current.tiles[1] // lab tile

      act(() => {
        result.current.handleTileClick(publicTile)
      })

      expect(consoleSpy).toHaveBeenCalledWith('导航失败:', expect.any(Error))

      consoleSpy.mockRestore()
    })
  })

  describe('Tile Status Updates', () => {
    it('should update tile status when authentication changes', () => {
      const { useLoginTrigger } = require('@/hooks/useLoginTrigger')

      // First render with unauthenticated user
      vi.mocked(useLoginTrigger).mockReturnValue({
        requireLogin: vi.fn(),
        isAuthenticated: false,
      })

      const { result, rerender } = renderHook(() => useTileManagement())

      const protectedTile = result.current.tiles[0]
      expect(result.current.getTileStatus(protectedTile).needsLogin).toBe(true)

      // Re-render with authenticated user
      vi.mocked(useLoginTrigger).mockReturnValue({
        requireLogin: vi.fn(),
        isAuthenticated: true,
      })

      rerender()

      expect(result.current.getTileStatus(protectedTile).needsLogin).toBe(false)
      expect(result.current.getTileStatus(protectedTile).isActive).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle tiles without needLogin property', () => {
      const { useLoginTrigger } = require('@/hooks/useLoginTrigger')
      vi.mocked(useLoginTrigger).mockReturnValue({
        requireLogin: vi.fn(),
        isAuthenticated: false,
      })

      const { result } = renderHook(() => useTileManagement())

      // Create a tile without needLogin property
      const tileWithoutLogin = { ...result.current.tiles[0] }
      delete (tileWithoutLogin as any).needLogin

      const status = result.current.getTileStatus(tileWithoutLogin)
      expect(status.isProtected).toBe(false)
      expect(status.needsLogin).toBe(false)
      expect(status.isActive).toBe(true)
    })

    it('should handle tiles with null needLogin property', () => {
      const { useLoginTrigger } = require('@/hooks/useLoginTrigger')
      vi.mocked(useLoginTrigger).mockReturnValue({
        requireLogin: vi.fn(),
        isAuthenticated: false,
      })

      const { result } = renderHook(() => useTileManagement())

      // Create a tile with null needLogin property
      const tileWithNullLogin = { ...result.current.tiles[0], needLogin: null as any }

      const status = result.current.getTileStatus(tileWithNullLogin)
      expect(status.isProtected).toBe(false)
      expect(status.needsLogin).toBe(false)
      expect(status.isActive).toBe(true)
    })
  })
})
