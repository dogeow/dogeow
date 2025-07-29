'use client'

import Footer from '@/components/app/Footer'
import { configs } from '@/app/configs'
import { TileCard } from '@/components/app/TileCard'
import { useTileManagement } from '@/hooks/useTileManagement'

export default function Home() {
  const { tiles, showProjectCovers, handleTileClick, getTileStatus } = useTileManagement()

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
          className="grid gap-3 sm:gap-4"
          style={{
            gridTemplateAreas: configs.gridLayout.templateAreas,
          }}
        >
          {tiles.map((tile, index) => (
            <div key={tile.name} style={{ gridArea: tile.name }} className="min-h-[8rem]">
              <TileCard
                tile={tile}
                index={index}
                keyPrefix="main"
                customStyles=""
                showCover={showProjectCovers}
                needsLogin={getTileStatus(tile).needsLogin}
                onClick={() => handleTileClick(tile)}
              />
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </>
  )
}
