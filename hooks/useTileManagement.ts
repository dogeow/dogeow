import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { configs } from '@/app/configs'
import type { Tile } from '@/app/types'
import { useProjectCoverStore } from '@/stores/projectCoverStore'
import { useLoginTrigger } from '@/hooks/useLoginTrigger'

export function useTileManagement() {
  const router = useRouter()
  // 直接使用原始configs.tiles，保持name为英文用于gridArea
  const tiles = configs.tiles as Tile[]
  const { showProjectCovers } = useProjectCoverStore()
  const { requireLogin, isAuthenticated } = useLoginTrigger()

  // 检查瓦片是否需要登录 - 直接使用配置文件中的 needLogin 属性
  const isProtectedTile = useCallback((tile: Tile) => {
    return tile.needLogin === true
  }, [])

  // 处理瓦片点击
  const handleTileClick = useCallback(
    (tile: Tile) => {
      try {
        if (isProtectedTile(tile)) {
          requireLogin(() => {
            router.push(tile.href)
          })
        } else {
          router.push(tile.href)
        }
      } catch (error) {
        console.error('导航失败:', error)
      }
    },
    [isProtectedTile, requireLogin, router]
  )

  // 检查瓦片状态
  const getTileStatus = useCallback(
    (tile: Tile) => {
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
  }
}
