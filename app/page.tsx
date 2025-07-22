"use client"

import { useCallback, Suspense } from "react"
import dynamic from 'next/dynamic'
import type { Tile } from '@/app/types'
import Footer from "@/components/app/Footer"
import { configs } from '@/app/configs'

// 动态导入TileCard组件，优化首屏加载
const TileCard = dynamic(() => import('./components/TileCard').then(mod => ({ default: mod.TileCard })), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-32" />,
  ssr: true
})

export default function Home() {
  const tiles = configs.tiles as Tile[]

  // 渲染单个瓦片
  const renderTile = useCallback((tile: Tile, index: number, gridArea?: string) => {
    try {
      // 使用 gridArea 而不是 colSpan/rowSpan
      const gridStyle = gridArea ? { gridArea } : {}

      return (
        <div key={tile.name} className="min-h-[8rem]" style={gridStyle}>
          <Suspense 
            fallback={<div className="animate-pulse bg-gray-200 rounded-lg h-32" />}
          >
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
          </Suspense>
        </div>
      )
    } catch (error) {
      console.error(`Error rendering tile ${tile.name}:`, error)
      return null
    }
  }, [])

  return (
    <>
      {/* SEO 优化 */}
      <div className="sr-only">
        <h1>DogeOW - 个人工具和游戏平台</h1>
        <p>包含物品管理、文件管理、笔记、导航、实验室和各种小游戏的综合平台</p>
      </div>
      
      {/* 主要内容区域 - 基于配置的动态网格布局 */}
      <main className="p-2 max-w-7xl">
        {/* 动态网格布局 - 根据配置自动生成 */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4" style={{ 
          gridTemplateRows: 'auto auto auto auto',
          gridTemplateAreas: `
            "thing thing thing"
            "lab file file"
            "lab tool tool"
            "nav note game"
          `
        }}>
          {tiles.map((tile, index) => {
            const gridArea = {
              '物品管理': 'thing',
              '实验室': 'lab',
              '文件': 'file',
              '工具': 'tool',
              '导航': 'nav',
              '笔记': 'note',
              '游戏': 'game'
            }[tile.name]
            
            return renderTile(tile, index, gridArea)
          })}
        </div>
      </main>
      
      <Footer />
    </>
  )
}
