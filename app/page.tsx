"use client"

import { useCallback, useState } from "react"
import type { Tile } from '@/app/types'
import Footer from "@/components/app/Footer"
import { configs } from '@/app/configs'
import { TileCard } from './components/TileCard'
import { ImagePreloader } from './components/ImagePreloader'

export default function Home() {
  const tiles = configs.tiles as Tile[]
  const [imagesLoaded, setImagesLoaded] = useState(false)
  
  // 预加载所有卡片图片
  const imagesToPreload = tiles
    .filter(tile => tile.cover)
    .map(tile => `/images/projects/${tile.cover}`)
    .concat(
      tiles
        .filter(tile => tile.icon)
        .map(tile => `/images/projects/${tile.icon}`)
    )

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
          needsLogin={false}
          onClick={() => {
            window.location.href = tile.href
          }}
        />
      </div>
    )
  }, [])

  return (
    <>
      {/* 预加载图片 */}
      <ImagePreloader 
        images={imagesToPreload} 
        onAllLoaded={() => setImagesLoaded(true)}
      />
      
      {/* SEO 优化 */}
      <div className="sr-only">
        <h1>DogeOW - 个人工具和游戏平台</h1>
        <p>包含物品管理、文件管理、笔记、导航、实验室和各种小游戏的综合平台</p>
      </div>

      {/* 主要内容区域 - 基于配置的动态网格布局 */}
      <main className="p-2 max-w-7xl">
        {/* 动态网格布局 - 根据配置自动生成 */}
        <div
          className={`tile-grid grid grid-cols-3 gap-3 sm:gap-4 transition-opacity duration-300 ${
            imagesLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            gridTemplateRows: 'auto auto auto auto',
            gridTemplateAreas: configs.gridLayout.templateAreas
          }}
        >
          {tiles.map((tile, index) => renderTile(tile, index, tile.gridArea))}
        </div>
        
        {/* 加载占位符 */}
        {!imagesLoaded && (
          <div className="grid grid-cols-3 gap-3 sm:gap-4 absolute inset-0 p-2">
            {tiles.map((tile) => (
              <div 
                key={`skeleton-${tile.name}`}
                className="min-h-[8rem] rounded-lg animate-pulse"
                style={{ 
                  backgroundColor: tile.color + '40',
                  gridArea: tile.gridArea 
                }}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  )
}
