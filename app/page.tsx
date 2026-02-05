'use client'

import Footer from '@/components/app/Footer'
import { configs } from '@/app/configs'
import { TileCard } from '@/components/app/TileCard'
import { useTileManagement } from '@/hooks/useTileManagement'

export default function Home() {
  const { tiles, showProjectCovers, handleTileClick, getTileStatus } = useTileManagement()

  return (
    <>
      {/* SEO 和可访问性优化 */}
      <div className="sr-only">
        <h1>DogeOW - 个人工具和游戏平台</h1>
        <p>包含物品管理、文件管理、笔记、导航、实验室和各种小游戏的综合平台</p>
      </div>

      {/* 主要内容区域 */}
      <main className="mx-auto w-full max-w-7xl p-2" role="main">
        {/* 静态网格布局 */}
        <div
          className="grid gap-3 sm:gap-4"
          style={{
            gridTemplateAreas: configs.gridLayout.templateAreas,
            gridTemplateColumns: `repeat(${configs.gridLayout.columns}, minmax(0, 1fr))`,
          }}
          role="grid"
          aria-label="应用程序网格"
        >
          {tiles.map((tile, index) => {
            const tileStatus = getTileStatus(tile)
            return (
              <div key={tile.name} style={{ gridArea: tile.name }}>
                <TileCard
                  tile={tile}
                  index={index}
                  customStyles=""
                  showCover={showProjectCovers}
                  needsLogin={tileStatus.needsLogin}
                  onClick={() => handleTileClick(tile)}
                />
              </div>
            )
          })}
        </div>
      </main>

      <Footer />
    </>
  )
}
