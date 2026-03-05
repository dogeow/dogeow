'use client'

import { useMemo } from 'react'
import Footer from '@/components/app/Footer'
import { configs } from '@/app/configs'
import { ThemedTileCard } from '@/components/app/ThemedTileCard'
import { MagazineLayout } from '@/components/app/MagazineLayout'
import { useTileManagement } from '@/hooks/useTileManagement'
import { PageContainer } from '@/components/layout'
import { useUITheme } from '@/components/themes/UIThemeProvider'
import { useLayoutStore } from '@/stores/layoutStore'
import type { Tile } from '@/app/types'

function TileList({
  tiles,
  showCover,
  getTileStatus,
  onTileClick,
}: {
  tiles: Tile[]
  showCover: boolean
  getTileStatus: (tile: Tile) => { needsLogin: boolean }
  onTileClick: (tile: Tile) => void
}) {
  return (
    <>
      {tiles.map((tile, index) => {
        const tileStatus = getTileStatus(tile)
        return (
          <ThemedTileCard
            key={tile.name}
            tile={tile}
            index={index}
            showCover={showCover}
            needsLogin={tileStatus.needsLogin}
            onClick={() => onTileClick(tile)}
          />
        )
      })}
    </>
  )
}

export default function Home() {
  const { tiles, showProjectCovers, handleTileClick, getTileStatus } = useTileManagement()
  const theme = useUITheme()
  const { siteLayout } = useLayoutStore()

  const layoutType = useMemo(() => {
    if (siteLayout === 'magazine') return 'magazine'
    if (!theme || theme.id === 'default') return 'grid'
    if (theme.id === 'dashboard') return 'dashboard'
    return 'list'
  }, [siteLayout, theme])

  return (
    <>
      <div className="sr-only">
        <h1>DogeOW - 个人工具和游戏平台</h1>
        <p>包含物品管理、文件管理、笔记、导航、实验室和各种小游戏的综合平台</p>
      </div>

      <PageContainer className="py-3">
        {layoutType === 'magazine' ? (
          <MagazineLayout
            tiles={tiles}
            showProjectCovers={showProjectCovers}
            getTileStatus={getTileStatus}
            handleTileClick={handleTileClick}
          />
        ) : layoutType === 'grid' ? (
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
                    showCover={showProjectCovers}
                    needsLogin={tileStatus.needsLogin}
                    onClick={() => handleTileClick(tile)}
                  />
                </div>
              )
            })}
          </div>
        ) : layoutType === 'dashboard' ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <TileList
              tiles={tiles}
              showCover={showProjectCovers}
              getTileStatus={getTileStatus}
              onTileClick={handleTileClick}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <TileList
              tiles={tiles}
              showCover={showProjectCovers}
              getTileStatus={getTileStatus}
              onTileClick={handleTileClick}
            />
          </div>
        )}
      </PageContainer>

      <Footer />
    </>
  )
}
