import React, { useState } from 'react'
import { LayoutGrid, Network, TreePine, Circle, Square } from 'lucide-react'
import type { ThemeColors } from '../types'

interface LayoutSelectorProps {
  currentLayout: string
  onLayoutChange: (layout: string) => void
  themeColors: ThemeColors
}

export function LayoutSelector({
  currentLayout,
  onLayoutChange,
  themeColors,
}: LayoutSelectorProps) {
  const layouts = [
    { id: 'force', name: '力导向', icon: Network },
    { id: 'tree', name: '树状', icon: TreePine },
    { id: 'circle', name: '圆形', icon: Circle },
    { id: 'grid', name: '网格', icon: LayoutGrid },
  ]

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
        display: 'flex',
        gap: 4,
        background: themeColors.card,
        padding: 4,
        borderRadius: 8,
        border: `1px solid ${themeColors.border}`,
      }}
    >
      {layouts.map(layout => {
        const IconComponent = layout.icon
        return (
          <button
            key={layout.id}
            onClick={() => onLayoutChange(layout.id)}
            title={layout.name}
            style={{
              padding: 8,
              borderRadius: 6,
              background: currentLayout === layout.id ? themeColors.primary : 'transparent',
              color: currentLayout === layout.id ? themeColors.card : themeColors.foreground,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconComponent size={16} />
          </button>
        )
      })}
    </div>
  )
}
