'use client'

import { memo, useMemo } from 'react'
import Footer from '@/components/app/Footer'
import { configs } from '@/app/configs'
import { TileCard } from '@/components/app/TileCard'
import { useTileManagement } from '@/hooks/useTileManagement'

// 提取网格项组件
const GridTile = memo(
  ({
    tile,
    index,
    showCover,
    needsLogin,
    onClick,
  }: {
    tile: unknown
    index: number
    showCover: boolean
    needsLogin: boolean
    onClick: () => void
  }) => (
    <div key={tile.name} style={{ gridArea: tile.name }} className="min-h-[8rem]">
      <TileCard
        tile={tile}
        index={index}
        keyPrefix="main"
        customStyles=""
        showCover={showCover}
        needsLogin={needsLogin}
        onClick={onClick}
      />
    </div>
  )
)

GridTile.displayName = 'GridTile'

export default function Home() {
  const { tiles, showProjectCovers, handleTileClick, getTileStatus } = useTileManagement()

  // 缓存网格样式
  const gridStyle = useMemo(
    () => ({
      gridTemplateAreas: configs.gridLayout.templateAreas,
    }),
    []
  )

  return (
    <>
      {/* SEO 和可访问性优化 */}
      <div className="sr-only">
        <h1>DogeOW - 个人工具和游戏平台</h1>
        <p>包含物品管理、文件管理、笔记、导航、实验室和各种小游戏的综合平台</p>
      </div>

      {/* 主要内容区域 */}
      <main className="max-w-7xl p-2" role="main">
        {/* 动态网格布局 */}
        <div
          className="grid gap-3 sm:gap-4"
          style={gridStyle}
          role="grid"
          aria-label="应用程序网格"
        >
          {tiles.map((tile, index) => {
            const tileStatus = getTileStatus(tile)
            return (
              <GridTile
                key={tile.name}
                tile={tile}
                index={index}
                showCover={showProjectCovers}
                needsLogin={tileStatus.needsLogin}
                onClick={() => handleTileClick(tile)}
              />
            )
          })}
        </div>
      </main>

      <Footer />
    </>
  )
}
