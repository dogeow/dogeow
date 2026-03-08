'use client'

import { useMemo } from 'react'
import { configs } from '@/app/configs'

function parseTemplateAreas(templateAreas: string): string[] {
  return templateAreas
    .trim()
    .split('\n')
    .map(row => row.trim().replaceAll('"', ''))
    .flatMap(row => row.split(/\s+/))
    .filter(area => area && area !== '.')
    .filter((area, index, areas) => areas.indexOf(area) === index)
}

export function HomeTilesSkeleton() {
  const areaNames = useMemo(() => parseTemplateAreas(configs.gridLayout.templateAreas), [])

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
      {areaNames.map(area => (
        <div key={area} style={{ gridArea: area }}>
          <div className="bg-card/70 relative flex min-h-[8rem] w-full overflow-hidden rounded-xl border border-white/10">
            <div className="absolute inset-0 animate-pulse bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))]" />
            <div className="relative z-[1] mt-auto flex items-center gap-2.5 p-3 sm:p-4">
              <div className="bg-white/20 h-5 w-5 rounded-md sm:h-6 sm:w-6" />
              <div className="bg-white/20 h-5 w-20 rounded sm:h-6 sm:w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
