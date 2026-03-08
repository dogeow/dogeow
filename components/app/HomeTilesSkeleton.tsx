'use client'

import { useMemo } from 'react'
import { configs } from '@/app/configs'

const BASE_TILE_MIN_HEIGHT_REM = 8
const GRID_GAP_REM = 1

type SkeletonArea = {
  name: string
  rowSpan: number
}

function parseTemplateAreaRows(templateAreas: string): string[][] {
  return templateAreas
    .trim()
    .split('\n')
    .map(row => row.trim().replaceAll('"', ''))
    .map(row => row.split(/\s+/).filter(Boolean))
}

function extractSkeletonAreas(templateAreas: string): SkeletonArea[] {
  const rows = parseTemplateAreaRows(templateAreas)
  const areaMap = new Map<string, { minRow: number; maxRow: number }>()

  rows.forEach((row, rowIndex) => {
    row.forEach(area => {
      if (!area || area === '.') return

      const current = areaMap.get(area)
      if (!current) {
        areaMap.set(area, { minRow: rowIndex, maxRow: rowIndex })
        return
      }

      current.minRow = Math.min(current.minRow, rowIndex)
      current.maxRow = Math.max(current.maxRow, rowIndex)
    })
  })

  return Array.from(areaMap.entries()).map(([name, { minRow, maxRow }]) => ({
    name,
    rowSpan: maxRow - minRow + 1,
  }))
}

export function HomeTilesSkeleton() {
  const areas = useMemo(() => extractSkeletonAreas(configs.gridLayout.templateAreas), [])

  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateAreas: configs.gridLayout.templateAreas,
        gridTemplateColumns: `repeat(${configs.gridLayout.columns}, minmax(0, 1fr))`,
      }}
      role="presentation"
      aria-hidden="true"
    >
      {areas.map(area => (
        <div key={area.name} style={{ gridArea: area.name }}>
          <div
            className="bg-card/70 relative flex w-full overflow-hidden rounded-xl border border-white/10"
            style={{
              minHeight: `calc(${BASE_TILE_MIN_HEIGHT_REM}rem * ${area.rowSpan} + ${GRID_GAP_REM}rem * ${Math.max(0, area.rowSpan - 1)})`,
            }}
          >
            <div className="absolute inset-0 animate-pulse bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))]" />
            <div className="relative z-[1] mt-auto flex items-center gap-2.5 p-3 sm:p-4">
              <div className="bg-white/20 h-5 w-5 rounded-md sm:h-6 sm:w-6" />
              <div className="bg-white/20 h-5 w-16 rounded sm:h-6 sm:w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
