import { useEffect, useCallback, useRef } from 'react'
import useSWR from 'swr'
import { get, put } from '@/lib/api'
import { useHomeLayoutStore, type TileConfig, type TileSize } from '@/stores/homeLayoutStore'
import { useLoginTrigger } from '@/hooks/useLoginTrigger'
import { toast } from 'sonner'

interface HomeLayoutResponse {
  id: number
  user_id: number
  layout: {
    tiles: TileConfig[]
  }
  created_at: string
  updated_at: string
}

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'

const VALID_TILE_SIZES: TileSize[] = ['1x1', '1x2', '2x1', '3x1']
const DEFAULT_TILE_SIZES: Record<string, TileSize> = {
  thing: '3x1',
  chat: '1x2',
  file: '2x1',
  tool: '1x1',
  lab: '1x1',
  nav: '1x1',
  note: '1x1',
  game: '1x1',
}

const debugLog = (...args: unknown[]) => {
  if (IS_DEVELOPMENT) {
    console.log(...args)
  }
}

const debugWarn = (...args: unknown[]) => {
  if (IS_DEVELOPMENT) {
    console.warn(...args)
  }
}

function normalizeTileSizes(tiles: TileConfig[], context: string): TileConfig[] {
  return tiles.map(tile => {
    if (!VALID_TILE_SIZES.includes(tile.size)) {
      const fixedSize = DEFAULT_TILE_SIZES[tile.name] || '1x1'
      console.warn(`⚠️ Fixing invalid size ${context}: ${tile.name} ${tile.size} -> ${fixedSize}`)
      return { ...tile, size: fixedSize }
    }

    return tile
  })
}

const fetcher = async (url: string): Promise<HomeLayoutResponse> => {
  try {
    const response = await get<HomeLayoutResponse>(url)
    debugLog('📥 Home layout fetched:', response)
    return response
  } catch (error) {
    console.error('Home layout API 请求失败:', error)
    throw error
  }
}

export function useHomeLayout() {
  const { isAuthenticated } = useLoginTrigger()
  const { setTiles: setStoreTiles, setIsDragging } = useHomeLayoutStore()
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef(false)
  const isSyncingRef = useRef(false) // 标记是否正在从服务端同步数据

  const { data, error, isLoading, mutate } = useSWR<HomeLayoutResponse>(
    isAuthenticated ? '/home/layout' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )

  // 从 API 数据中提取 tiles
  const layoutTiles = data?.layout?.tiles || []

  // 同步服务端数据到 store（仅在初始加载或非保存状态时）
  useEffect(() => {
    // 数据格式：{ id, user_id, layout: { tiles: [...] }, ... }
    const tiles = data?.layout?.tiles

    if (tiles && Array.isArray(tiles) && tiles.length > 0) {
      // 如果正在保存，不覆盖本地数据
      if (!isSavingRef.current) {
        debugLog('📥 Syncing data to store (no save):', tiles)
        // 设置同步标志，防止其他 useEffect 触发保存
        isSyncingRef.current = true
        // 直接更新 store，不触发保存（避免循环保存）
        setStoreTiles(tiles)
        // 延迟重置同步标志，确保其他 useEffect 不会触发
        setTimeout(() => {
          isSyncingRef.current = false
          debugLog('✅ Sync completed, isSyncingRef reset')
        }, 100)
      } else {
        debugLog('⏸️ Skipping sync (saving in progress)')
      }
    } else if (data) {
      debugWarn('⚠️ No tiles in data:', data)
    }
  }, [data, setStoreTiles])

  // 保存布局到服务端（带防抖）
  const saveLayout = useCallback(
    async (tilesToSave: TileConfig[]) => {
      if (!isAuthenticated) {
        return // 未登录用户不保存
      }

      const fixedTiles = normalizeTileSizes(tilesToSave, 'before save')

      isSavingRef.current = true
      try {
        debugLog('💾 Saving layout:', fixedTiles)

        const response = await put<{ message: string; layout: HomeLayoutResponse }>(
          '/home/layout',
          {
            layout: {
              tiles: fixedTiles,
            },
          }
        )

        debugLog('✅ Layout saved, response:', JSON.stringify(response, null, 2))

        // 使用返回的数据更新 store
        // API 返回格式: { message: "...", layout: HomeLayoutResponse }
        // HomeLayoutResponse 包含: { id, user_id, layout: { tiles: [...] }, ... }
        // 所以正确的路径是: response.layout.layout.tiles
        const savedTiles = response?.layout?.layout?.tiles

        debugLog('🔍 Extracted tiles:', savedTiles)
        debugLog('🔍 Response structure:', {
          hasLayout: !!response?.layout,
          hasLayoutLayout: !!response?.layout?.layout,
          hasTiles: !!response?.layout?.layout?.tiles,
          layoutKeys: response?.layout ? Object.keys(response.layout) : [],
        })

        if (savedTiles && Array.isArray(savedTiles) && savedTiles.length > 0) {
          // 直接更新 store，不触发保存
          useHomeLayoutStore.getState().setTiles(savedTiles)
          debugLog('🔄 Store updated with saved tiles:', savedTiles)

          // 更新 SWR 缓存，使用返回的完整数据结构
          if (response.layout) {
            await mutate(response.layout as HomeLayoutResponse, false)
          }
        } else {
          // 如果返回格式不对，尝试其他路径
          debugWarn('⚠️ Unexpected response format, trying alternative paths:', response)

          type AltLayoutResponse = {
            layout?: { tiles?: TileConfig[] }
            tiles?: TileConfig[]
            data?: { layout?: { tiles?: TileConfig[] } }
          }
          const alt = response as AltLayoutResponse
          const altTiles1 = alt?.layout?.tiles
          const altTiles2 = alt?.tiles
          const altTiles3 = alt?.data?.layout?.tiles

          let foundTiles: TileConfig[] | null = null
          if (altTiles1 && Array.isArray(altTiles1)) {
            debugLog('✅ Found tiles at response.layout.tiles')
            foundTiles = altTiles1
          } else if (altTiles2 && Array.isArray(altTiles2)) {
            debugLog('✅ Found tiles at response.tiles')
            foundTiles = altTiles2
          } else if (altTiles3 && Array.isArray(altTiles3)) {
            debugLog('✅ Found tiles at response.data.layout.tiles')
            foundTiles = altTiles3
          } else {
            console.error('❌ Could not find tiles in response:', response)
            // 如果找不到，重新获取数据（但保持 isSavingRef 为 true）
            await mutate()
            // 延迟重置，确保 mutate 完成后再重置
            setTimeout(() => {
              isSavingRef.current = false
            }, 500)
            return
          }

          if (foundTiles) {
            useHomeLayoutStore.getState().setTiles(foundTiles)
            // 更新 SWR 缓存
            if (response.layout) {
              await mutate(response.layout as HomeLayoutResponse, false)
            }
          }
        }
      } catch (error) {
        console.error('保存布局失败:', error)
        toast.error('保存布局失败，请稍后重试')
        isSavingRef.current = false
      } finally {
        // 延迟重置，确保所有异步操作完成后再重置
        // 这样 useEffect 中的同步逻辑不会覆盖刚保存的数据
        setTimeout(() => {
          isSavingRef.current = false
          debugLog('✅ Save completed, isSavingRef reset')
        }, 300)
      }
    },
    [isAuthenticated, mutate]
  )

  // 防抖保存函数
  const debouncedSave = useCallback(
    (tilesToSave: TileConfig[]) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveLayout(tilesToSave)
        saveTimeoutRef.current = null
      }, 500) // 500ms 防抖
    },
    [saveLayout]
  )

  // 清理 timeout
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // 静默更新 store（不触发保存），用于从服务端同步数据
  const setTilesSilent = useCallback(
    (newTiles: TileConfig[]) => {
      setStoreTiles(newTiles)
    },
    [setStoreTiles]
  )

  return {
    tiles: layoutTiles, // 返回从 API 获取的 tiles，而不是 store 中的 tiles
    isLoading,
    error,
    setTiles: (newTiles: TileConfig[]) => {
      // 如果正在同步数据，不触发保存
      if (isSyncingRef.current) {
        debugLog('⏸️ Skipping save (syncing in progress)')
        return
      }

      const fixedTiles = normalizeTileSizes(newTiles, 'for setTiles')

      // 先更新 store（不触发保存）
      setStoreTiles(fixedTiles)
      // 然后保存（防抖）
      debouncedSave(fixedTiles)
    },
    setTilesSilent, // 静默更新，不触发保存
    setIsDragging,
    isAuthenticated,
    // 直接保存函数（不防抖，用于立即保存）
    saveLayoutImmediate: saveLayout,
    // 导出同步标志，供外部检查
    isSyncing: () => isSyncingRef.current,
  }
}
