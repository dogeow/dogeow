'use client'

import { useMemo, useSyncExternalStore } from 'react'
import dynamic from 'next/dynamic'
import { configs } from '@/app/configs'
import { ThemedTileCard } from '@/components/app/ThemedTileCard'
import { HomeTilesSkeleton } from '@/components/app/HomeTilesSkeleton'
import { useTileManagement } from '@/hooks/useTileManagement'
import { PageContainer } from '@/components/layout'
import { useUITheme } from '@/components/themes/UIThemeProvider'
import { useLayoutStore } from '@/stores/layoutStore'
import { useTranslation } from '@/hooks/useTranslation'
import type { Tile } from '@/app/types'
import type { ProjectCoverMode } from '@/stores/projectCoverStore'

const MagazineLayout = dynamic(
  () => import('@/components/app/MagazineLayout').then(mod => mod.MagazineLayout),
  { ssr: true }
)
const IconLayout = dynamic(
  () => import('@/components/app/IconLayout').then(mod => mod.IconLayout),
  {
    ssr: true,
  }
)

const Footer = dynamic(() => import('@/components/app/Footer'), {
  ssr: true,
})

const HOME_TILES_GAP = 'gap-4'
const HOME_LIST_GAP = 'space-y-4'
const HOME_SECTION_SPACING = 'space-y-6'

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

function TileList({
  tiles,
  projectCoverMode,
  getTileStatus,
  onTileClick,
}: {
  tiles: Tile[]
  projectCoverMode: ProjectCoverMode
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
            projectCoverMode={projectCoverMode}
            needsLogin={tileStatus.needsLogin}
            onClick={() => onTileClick(tile)}
          />
        )
      })}
    </>
  )
}

export function HomePage() {
  const { tiles, projectCoverMode, handleTileClick, getTileStatus } = useTileManagement()
  const theme = useUITheme()
  const { siteLayout } = useLayoutStore()
  const { t } = useTranslation()
  const isHydrated = useHydrated()

  const layoutType = useMemo(() => {
    if (siteLayout === 'icon') return 'icon'
    if (siteLayout === 'magazine') return 'magazine'
    if (!theme || theme.id === 'default') return 'grid'
    if (theme.id === 'dashboard') return 'dashboard'
    return 'list'
  }, [siteLayout, theme])

  return (
    <>
      <div className="sr-only">
        <h1>{t('home.title', 'DogeOW - 个人工具和游戏平台')}</h1>
        <p>
          {t('home.description', '一个以自用和测试为主的个人工具平台，欢迎来到我的数字后花园！')}
        </p>
      </div>

      <PageContainer className={`py-4 sm:py-6 ${HOME_SECTION_SPACING}`}>
        <header className="space-y-1">
          <h2 className="text-foreground text-xl font-semibold tracking-tight sm:text-2xl">
            {t('home.title', 'DogeOW - 个人工具和游戏平台')}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            {t('home.description', '一个以自用和测试为主的个人工具平台，欢迎来到我的数字后花园！')}
          </p>
        </header>

        <section aria-label={t('home.section_tiles', '应用入口')}>
          {!isHydrated && layoutType === 'grid' ? (
            <HomeTilesSkeleton />
          ) : layoutType === 'magazine' ? (
            <MagazineLayout
              tiles={tiles}
              projectCoverMode={projectCoverMode}
              getTileStatus={getTileStatus}
              handleTileClick={handleTileClick}
            />
          ) : layoutType === 'icon' ? (
            <IconLayout
              tiles={tiles}
              projectCoverMode={projectCoverMode}
              getTileStatus={getTileStatus}
              handleTileClick={handleTileClick}
            />
          ) : layoutType === 'grid' ? (
            <div
              className={`grid ${HOME_TILES_GAP}`}
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
                      projectCoverMode={projectCoverMode}
                      needsLogin={tileStatus.needsLogin}
                      onClick={() => handleTileClick(tile)}
                    />
                  </div>
                )
              })}
            </div>
          ) : layoutType === 'dashboard' ? (
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${HOME_TILES_GAP}`}>
              <TileList
                tiles={tiles}
                projectCoverMode={projectCoverMode}
                getTileStatus={getTileStatus}
                onTileClick={handleTileClick}
              />
            </div>
          ) : (
            <div className={HOME_LIST_GAP}>
              <TileList
                tiles={tiles}
                projectCoverMode={projectCoverMode}
                getTileStatus={getTileStatus}
                onTileClick={handleTileClick}
              />
            </div>
          )}
        </section>
      </PageContainer>

      <Footer />
    </>
  )
}
