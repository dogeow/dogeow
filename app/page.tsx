"use client"

import { useEffect, useCallback, Suspense } from "react"
import dynamic from 'next/dynamic'
import type { Tile } from '@/app/types'
import Footer from "@/components/app/Footer"
import { configs } from '@/app/configs'

// 动态导入TileCard组件，优化首屏加载
const TileCard = dynamic(() => import('./components/TileCard').then(mod => ({ default: mod.TileCard })), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-32" />,
  ssr: true
})

// 控制台Logo文本
const LOGO_TEXT = `
╔╦╗┌─┐┌─┐┌─┐╔═╗╦ ╦
 ║║│ ││ ┬├┤ ║ ║║║║
═╩╝└─┘└─┘└─┘╚═╝╚╩╝
`

export default function Home() {
  const tiles = configs.tiles as Tile[]

  // 渲染单个瓦片
  const renderTile = useCallback((tile: Tile, index: number) => {
    try {
      // 根据配置动态生成样式类
      const gridClasses = [
        tile.colSpan && tile.colSpan > 1 ? `col-span-${tile.colSpan}` : '',
        tile.rowSpan && tile.rowSpan > 1 ? `row-span-${tile.rowSpan}` : '',
        'min-h-[8rem]'
      ].filter(Boolean).join(' ')

      return (
        <div key={tile.name} className={gridClasses}>
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
                // 简化的点击处理，可以根据需要扩展
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

  // 控制台Logo输出
  useEffect(() => {
    console.log(`%c${LOGO_TEXT}`, "color: yellow")
    
    // 输出统计信息
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 页面统计:', {
        total: tiles.length,
        tiles: tiles.map(t => `${t.name}(${t.colSpan}x${t.rowSpan})`)
      })
    }
  }, [tiles])

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
        <div className="grid grid-cols-3 gap-3 sm:gap-4" style={{ gridTemplateRows: 'auto auto auto auto' }}>
          {tiles.map((tile, index) => renderTile(tile, index))}
        </div>
      </main>
      
      <Footer />
    </>
  )
}
