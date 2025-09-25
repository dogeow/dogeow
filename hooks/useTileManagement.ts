import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { configs } from '@/app/configs'
import type { Tile } from '@/app/types'
import { useProjectCoverStore } from '@/stores/projectCoverStore'
import { useLoginTrigger } from '@/hooks/useLoginTrigger'

// 类型定义
interface TileStatus {
  readonly isProtected: boolean
  readonly needsLogin: boolean
  readonly isActive: boolean
}

export function useTileManagement() {
  const router = useRouter()
  const { showProjectCovers } = useProjectCoverStore()
  const { requireLogin, isAuthenticated } = useLoginTrigger()

  // 缓存 tiles 数据
  const tiles = useMemo(() => configs.tiles as Tile[], [])

  // 简化保护检查逻辑
  const isProtectedTile = useCallback((tile: Tile): boolean => {
    return Boolean(tile.needLogin)
  }, [])

  // 优化导航处理
  const handleTileClick = useCallback(
    (tile: Tile) => {
      const navigate = () => router.push(tile.href)

      if (isProtectedTile(tile)) {
        requireLogin(navigate)
      } else {
        navigate()
      }
    },
    [isProtectedTile, requireLogin, router]
  )

  // 优化状态计算
  const getTileStatus = useCallback(
    (tile: Tile): TileStatus => {
      const isProtected = isProtectedTile(tile)
      const needsLogin = isProtected && !isAuthenticated

      return {
        isProtected,
        needsLogin,
        isActive: !needsLogin,
      }
    },
    [isProtectedTile, isAuthenticated]
  )

  return {
    tiles,
    showProjectCovers,
    handleTileClick,
    getTileStatus,
    isAuthenticated,
  } as const
}
