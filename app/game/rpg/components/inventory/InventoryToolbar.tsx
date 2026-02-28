'use client'

import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CopperDisplay } from '../shared/CopperDisplay'
import { ItemQuality, QUALITY_COLORS, QUALITY_NAMES } from '../../types'
import { INVENTORY_CATEGORIES, RECYCLE_QUALITIES } from './inventoryConfig'

interface QualityStat {
  count: number
  totalPrice: number
}

interface InventoryToolbarProps {
  categoryId: string
  inventoryCount: number
  inventorySize: number
  isLoading: boolean
  onCategoryChange: (categoryId: string) => void
  onRecycleQuality: (quality: string) => void
  onShowStorageChange: (showStorage: boolean) => void
  onSort: (sortType: 'default' | 'quality' | 'price') => void
  qualityStats: Record<string, QualityStat>
  recyclingQuality: string | null
  showStorage: boolean
  storageCount: number
  storageSize: number
}

export function InventoryToolbar({
  categoryId,
  inventoryCount,
  inventorySize,
  isLoading,
  onCategoryChange,
  onRecycleQuality,
  onShowStorageChange,
  onSort,
  qualityStats,
  recyclingQuality,
  showStorage,
  storageCount,
  storageSize,
}: InventoryToolbarProps) {
  const [sortOpen, setSortOpen] = useState(false)

  return (
    <div className="mb-3 flex shrink-0 flex-wrap items-center gap-1.5 sm:mb-4 sm:gap-2">
      <button
        type="button"
        onClick={() => onShowStorageChange(false)}
        className={`flex flex-col items-center rounded px-2.5 py-1 text-xs sm:px-3 sm:text-sm ${
          !showStorage ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}
      >
        <span>背包</span>
        <span className="text-[10px] opacity-90 sm:text-xs">
          {inventoryCount}/{inventorySize}
        </span>
      </button>
      <button
        type="button"
        onClick={() => onShowStorageChange(true)}
        className={`flex flex-col items-center rounded px-2.5 py-1 text-xs sm:px-3 sm:text-sm ${
          showStorage ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}
      >
        <span>仓库</span>
        <span className="text-[10px] opacity-90 sm:text-xs">
          {storageCount}/{storageSize}
        </span>
      </button>
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={`rounded px-2 py-1.5 text-sm transition-colors ${
                categoryId
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              title="筛选"
            >
              <span>筛选</span>
              {categoryId && (
                <span className="ml-1 text-xs">
                  {INVENTORY_CATEGORIES.find(category => category.id === categoryId)?.emoji}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-32 p-1" align="end">
            <button
              type="button"
              onClick={() => onCategoryChange('')}
              className={`hover:bg-muted flex w-full items-center rounded px-2 py-1.5 text-left text-sm ${
                !categoryId ? 'bg-muted font-medium' : ''
              }`}
            >
              全部
            </button>
            {INVENTORY_CATEGORIES.map(category => (
              <button
                key={category.id}
                type="button"
                onClick={() => onCategoryChange(category.id)}
                className={`hover:bg-muted flex w-full items-center rounded px-2 py-1.5 text-left text-sm ${
                  categoryId === category.id ? 'bg-muted font-medium' : ''
                }`}
              >
                <span className="mr-2">{category.emoji}</span>
                {category.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>
        {!showStorage && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="bg-muted text-muted-foreground hover:bg-muted/80 flex items-center gap-1 rounded px-2 py-1.5 text-sm transition-colors"
                title="回收"
              >
                <span>回收</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 space-y-1 p-2" align="end">
              {RECYCLE_QUALITIES.map(quality => {
                const stats = qualityStats[quality] || { count: 0, totalPrice: 0 }
                const isDisabled = stats.count === 0

                return (
                  <button
                    key={quality}
                    type="button"
                    onClick={() => onRecycleQuality(quality)}
                    disabled={isLoading || recyclingQuality === quality || isDisabled}
                    className="flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      backgroundColor: `${QUALITY_COLORS[quality as ItemQuality]}${isDisabled ? '10' : '20'}`,
                      color: isDisabled
                        ? `${QUALITY_COLORS[quality as ItemQuality]}60`
                        : QUALITY_COLORS[quality as ItemQuality],
                    }}
                  >
                    <span>
                      {QUALITY_NAMES[quality as ItemQuality]}
                      <span className="ml-1 text-xs opacity-70">×{stats.count}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <CopperDisplay copper={stats.totalPrice} size="xs" />
                      {recyclingQuality === quality && <span className="animate-spin">⏳</span>}
                    </span>
                  </button>
                )
              })}
            </PopoverContent>
          </Popover>
        )}
        <Popover open={sortOpen} onOpenChange={setSortOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="bg-muted text-muted-foreground hover:bg-muted/80 flex items-center gap-1 rounded px-2 py-1.5 text-sm transition-colors"
              title="排序"
            >
              <span>排序</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-24 p-1" align="end">
            <button
              type="button"
              onClick={() => {
                onSort('default')
                setSortOpen(false)
              }}
              className="hover:bg-muted flex w-full items-center rounded px-2 py-1.5 text-left text-sm"
            >
              默认
            </button>
            <button
              type="button"
              onClick={() => {
                onSort('quality')
                setSortOpen(false)
              }}
              className="hover:bg-muted flex w-full items-center rounded px-2 py-1.5 text-left text-sm"
            >
              品质
            </button>
            <button
              type="button"
              onClick={() => {
                onSort('price')
                setSortOpen(false)
              }}
              className="hover:bg-muted flex w-full items-center rounded px-2 py-1.5 text-left text-sm"
            >
              价格
            </button>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
