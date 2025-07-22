import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { configs } from '@/app/configs'
import type { Tile } from '@/app/types'
import { useProjectCoverStore } from '@/stores/projectCoverStore'
import { useLoginTrigger } from '@/hooks/useLoginTrigger'

// 常量定义
const PROTECTED_ROUTES = ['/thing', '/nav', '/note', '/dashboard', '/file', '/tool'] as const

export function useTileManagement() {
  const router = useRouter()
  const tiles = configs.tiles as Tile[]
  const { showProjectCovers } = useProjectCoverStore()
  const { requireLogin, isAuthenticated } = useLoginTrigger()

  // 检查是否需要登录
  const isProtectedRoute = useCallback((href: string) => {
    return PROTECTED_ROUTES.some(route => href.startsWith(route))
  }, [])

  // 处理瓦片点击
  const handleTileClick = useCallback((tile: Tile) => {
    try {
      if (isProtectedRoute(tile.href)) {
        requireLogin(() => {
          router.push(tile.href)
        })
      } else {
        router.push(tile.href)
      }
    } catch (error) {
      console.error('导航失败:', error)
    }
  }, [isProtectedRoute, requireLogin, router])

  // 检查瓦片状态
  const getTileStatus = useCallback((tile: Tile) => {
    const isProtected = isProtectedRoute(tile.href)
    const needsLogin = isProtected && !isAuthenticated

    return {
      isProtected,
      needsLogin,
      isActive: !needsLogin
    }
  }, [isProtectedRoute, isAuthenticated])

  return {
    tiles,
    showProjectCovers,
    handleTileClick,
    getTileStatus,
    isAuthenticated
  }
} 