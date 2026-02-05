import { create } from 'zustand'

export type TileSize = '1x1' | '1x2' | '2x1' | '3x1'

export interface TileConfig {
  name: string
  size: TileSize
  order: number
}

interface HomeLayoutState {
  tiles: TileConfig[]
  isDragging: boolean
  setTiles: (tiles: TileConfig[]) => void
  updateTileSize: (name: string, size: TileSize) => void
  reorderTiles: (fromIndex: number, toIndex: number) => void
  setIsDragging: (isDragging: boolean) => void
}

export const useHomeLayoutStore = create<HomeLayoutState>(set => ({
  tiles: [],
  isDragging: false,
  setTiles: (tiles: TileConfig[]) => set({ tiles }),
  updateTileSize: (name: string, size: TileSize) =>
    set(state => ({
      tiles: state.tiles.map(tile => (tile.name === name ? { ...tile, size } : tile)),
    })),
  reorderTiles: (fromIndex: number, toIndex: number) =>
    set(state => {
      // 确保 tiles 按 order 排序
      const sortedTiles = [...state.tiles].sort((a, b) => a.order - b.order)
      const newTiles = [...sortedTiles]
      const [moved] = newTiles.splice(fromIndex, 1)
      newTiles.splice(toIndex, 0, moved)
      // 更新 order
      const reordered = newTiles.map((tile, index) => ({ ...tile, order: index }))
      console.log('🔄 Store reorderTiles:', {
        fromIndex,
        toIndex,
        moved: moved.name,
        result: reordered.map(t => `${t.name}(${t.order})`).join(', '),
      })
      return {
        tiles: reordered,
      }
    }),
  setIsDragging: (isDragging: boolean) => set({ isDragging }),
}))
