import { useMemo, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { configs } from '@/app/configs'
import type { Tile } from '@/app/types'
import { useProjectCoverStore } from '@/stores/projectCoverStore'
import { useLoginTrigger } from '@/hooks/useLoginTrigger'

// 常量定义
const PROTECTED_ROUTES = ['/thing', '/nav', '/note', '/dashboard', '/file', '/tool'] as const

// 瓦片分组配置
const TILE_GROUPS = {
  top: { start: 0, count: 1 },      // 物品管理
  middle: { start: 1, count: 1 },   // 实验室
  right: { start: 2, count: 2 },    // 文件和工具
  bottom: { start: 4, count: 3 }    // 导航、笔记和游戏
} as const

// 类型定义
type TileGroup = keyof typeof TILE_GROUPS
type TileGroups = Record<TileGroup, Tile[]>

export function useTileManagement() {
  const router = useRouter()
  const tiles = configs.tiles as Tile[]
  const { showProjectCovers } = useProjectCoverStore()
  const { requireLogin, isAuthenticated } = useLoginTrigger()
  
  // 使用 ref 缓存计算结果，避免不必要的重新计算
  const memoizedTiles = useRef<Tile[]>(tiles)
  
  // 只有当 tiles 真的改变时才更新
  if (JSON.stringify(memoizedTiles.current) !== JSON.stringify(tiles)) {
    memoizedTiles.current = tiles
  }

  // 检查是否需要登录 - 使用更高效的查找
  const isProtectedRoute = useCallback((href: string) => {
    return PROTECTED_ROUTES.some(route => href.startsWith(route))
  }, [])

  // 处理瓦片点击 - 添加错误处理
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
      // 可以在这里添加错误提示
    }
  }, [isProtectedRoute, requireLogin, router])

  // 瓦片分组数据 - 使用更高效的分组算法
  const tilesGroups = useMemo((): TileGroups => {
    const groups = {} as TileGroups
    
    // 验证配置和数据完整性
    if (!memoizedTiles.current || memoizedTiles.current.length === 0) {
      console.warn('Tiles data is empty or invalid')
      return {
        top: [],
        middle: [],
        right: [],
        bottom: []
      }
    }
    
    // 高效地分组瓦片
    for (const [groupName, config] of Object.entries(TILE_GROUPS)) {
      const group = groupName as TileGroup
      const { start, count } = config
      const endIndex = Math.min(start + count, memoizedTiles.current.length)
      
      groups[group] = memoizedTiles.current.slice(start, endIndex)
    }
    
    return groups
  }, [memoizedTiles.current])

  // 检查瓦片状态 - 优化性能
  const getTileStatus = useCallback((tile: Tile) => {
    const isProtected = isProtectedRoute(tile.href)
    const needsLogin = isProtected && !isAuthenticated
    
    return { 
      isProtected, 
      needsLogin,
      isActive: !needsLogin // 添加活跃状态
    }
  }, [isProtectedRoute, isAuthenticated])

  // 获取分组统计信息
  const getGroupStats = useCallback(() => {
    const stats = {
      total: memoizedTiles.current.length,
      protected: 0,
      accessible: 0
    }
    
    memoizedTiles.current.forEach(tile => {
      const { isProtected } = getTileStatus(tile)
      if (isProtected) {
        stats.protected++
      } else {
        stats.accessible++
      }
    })
    
    return stats
  }, [getTileStatus])

  return {
    tilesGroups,
    showProjectCovers,
    handleTileClick,
    getTileStatus,
    getGroupStats,
    isAuthenticated
  }
} 