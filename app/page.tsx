'use client'

import Footer from '@/components/app/Footer'
import { configs } from '@/app/configs'
import { ThemedTileCard } from '@/components/app/ThemedTileCard'
import { MagazineLayout } from '@/components/app/MagazineLayout'
import { useTileManagement } from '@/hooks/useTileManagement'
import { PageContainer } from '@/components/layout'
import { useUITheme } from '@/components/themes/UIThemeProvider'
import { useLayoutStore } from '@/stores/layoutStore'

export default function Home() {
  const { tiles, showProjectCovers, handleTileClick, getTileStatus } = useTileManagement()
  const theme = useUITheme()
  const { siteLayout } = useLayoutStore()

  // 根据主题决定布局方式
  const isGridLayout = !theme || theme.id === 'default'
  const isDashboardLayout = theme?.id === 'dashboard'
  const isMagazineLayout = siteLayout === 'magazine'

  return (
    <>
      {/* SEO 和可访问性优化 */}
      <div className="sr-only">
        <h1>DogeOW - 个人工具和游戏平台</h1>
        <p>包含物品管理、文件管理、笔记、导航、实验室和各种小游戏的综合平台</p>
      </div>

      {/* 主要内容区域 */}
      <PageContainer className="py-2">
        {isMagazineLayout ? (
          /* 杂志风格布局 */
          <MagazineLayout
            tiles={tiles}
            showProjectCovers={showProjectCovers}
            getTileStatus={getTileStatus}
            handleTileClick={handleTileClick}
          />
        ) : isGridLayout ? (
          /* 默认网格布局 */
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
                  <ThemedTileCard
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
        ) : isDashboardLayout ? (
          /* Dashboard 主题：3列网格布局 */
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tiles.map((tile, index) => {
              const tileStatus = getTileStatus(tile)
              return (
                <ThemedTileCard
                  key={tile.name}
                  tile={tile}
                  index={index}
                  customStyles=""
                  showCover={showProjectCovers}
                  needsLogin={tileStatus.needsLogin}
                  onClick={() => handleTileClick(tile)}
                />
              )
            })}
          </div>
        ) : (
          /* 其他主题：默认列表布局 */
          <div className="space-y-3">
            {tiles.map((tile, index) => {
              const tileStatus = getTileStatus(tile)
              return (
                <ThemedTileCard
                  key={tile.name}
                  tile={tile}
                  index={index}
                  customStyles=""
                  showCover={showProjectCovers}
                  needsLogin={tileStatus.needsLogin}
                  onClick={() => handleTileClick(tile)}
                />
              )
            })}
          </div>
        )}
      </PageContainer>

      <Footer />
    </>
  )
}
