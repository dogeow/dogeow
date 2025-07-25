'use client'

import { useCallback } from 'react'
import type { Tile } from '@/app/types'
import Footer from '@/components/app/Footer'
import { configs } from '@/app/configs'
import { TileCard } from '@/components/app/TileCard'
import { useTileManagement } from '@/hooks/useTileManagement'

export default function Home() {
  const { tiles, showProjectCovers, handleTileClick, getTileStatus, isAuthenticated } =
    useTileManagement()

  // 渲染单个瓦片
  const renderTile = useCallback(
    (tile: Tile, index: number, gridArea?: string) => {
      const gridStyle = gridArea ? { gridArea } : {}
      const { needsLogin, isProtected } = getTileStatus(tile)

      // 开发环境下的调试信息
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `Tile ${tile.name}: needsLogin=${needsLogin}, isProtected=${isProtected}, isAuthenticated=${isAuthenticated}, showProjectCovers=${showProjectCovers}, cover=${tile.cover}`
        )
      }

      return (
        <div key={tile.name} className="min-h-[8rem]" style={gridStyle}>
          <TileCard
            tile={tile}
            index={index}
            keyPrefix="main"
            customStyles=""
            showCover={showProjectCovers}
            needsLogin={needsLogin}
            onClick={() => handleTileClick(tile)}
          />
        </div>
      )
    },
    [getTileStatus, handleTileClick, isAuthenticated, showProjectCovers]
  )

  return (
    <>
      {/* SEO 优化 */}
      <div className="sr-only">
        <h1>DogeOW - 个人工具和游戏平台</h1>
        <p>包含物品管理、文件管理、笔记、导航、实验室和各种小游戏的综合平台</p>
      </div>

      {/* 主要内容区域 - 基于配置的动态网格布局 */}
      <main className="max-w-7xl p-2">
        {/* 动态网格布局 - 根据配置自动生成 */}
        <div
          className="tile-grid grid grid-cols-3 gap-3 sm:gap-4"
          style={{
            gridTemplateRows: 'auto auto auto auto',
            gridTemplateAreas: configs.gridLayout.templateAreas,
          }}
        >
          {tiles.map((tile, index) => renderTile(tile, index, tile.gridArea || tile.name))}
        </div>
      </main>

      <Footer />
    </>
  )
}
