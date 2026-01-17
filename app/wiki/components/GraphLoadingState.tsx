import React from 'react'
import type { ThemeColors } from '../types'

interface GraphLoadingStateProps {
  themeColors: ThemeColors
  isDark: boolean
}

export function GraphLoadingState({ themeColors, isDark }: GraphLoadingStateProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 100,
        background: themeColors.card,
        padding: '20px 40px',
        borderRadius: 8,
        boxShadow: isDark ? '0 6px 18px rgba(0,0,0,0.45)' : '0 4px 12px rgba(0,0,0,0.1)',
        border: `1px solid ${themeColors.border}`,
      }}
    >
      加载中...
    </div>
  )
}
