'use client'

import { useCallback } from 'react'
import type { Tile } from '@/app/types'
import Footer from '@/components/app/Footer'
import { configs } from '@/app/configs'
import { TileCard } from './components/TileCard'

export default function Home() {
  const tiles = configs.tiles as Tile[]

  // 渲染单个瓦片
  const renderTile = useCallback((tile: Tile, index: number, gridArea?: string) => {
    const gridStyle = gridArea ? { gridArea } : {}

    return (
      <div key={tile.name} className="min-h-[8rem]" style={gridStyle}>
        <TileCard
          tile={tile}
          index={index}
          keyPrefix="main"
          customStyles=""
          showCover={true}
          needsLogin={tile.needLogin}
          onClick={() => {
            window.location.href = tile.href
          }}
        />
      </div>
    )
  }, [])

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
          {tiles.map((tile, index) => renderTile(tile, index, tile.gridArea))}
        </div>
      </main>

      <Footer />
    </>
  )
}
