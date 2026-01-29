import React from 'react'
import { AlertTriangle, ZoomIn, Filter } from 'lucide-react'
import type { ThemeColors } from '../types'

interface PerformanceWarningProps {
  isVisible: boolean
  nodeCount: number
  themeColors: ThemeColors
  onOptimizeClick: () => void
}

export function PerformanceWarning({
  isVisible,
  nodeCount,
  themeColors,
  onOptimizeClick,
}: PerformanceWarningProps) {
  if (!isVisible) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: 60,
        left: 12,
        zIndex: 30,
        background: themeColors.card,
        border: `1px solid #f59e0b`,
        borderRadius: 8,
        padding: 12,
        maxWidth: 400,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <AlertTriangle
          size={20}
          style={{
            color: '#f59e0b',
            marginTop: 2,
            flexShrink: 0,
          }}
        />
        <div>
          <h4
            style={{
              margin: '0 0 4px 0',
              fontWeight: '600',
              color: themeColors.foreground,
              fontSize: 14,
            }}
          >
            性能提示
          </h4>
          <p
            style={{
              margin: '0 0 8px 0',
              color: themeColors.mutedForeground,
              fontSize: 13,
              lineHeight: 1.4,
            }}
          >
            当前图谱包含 {nodeCount}{' '}
            个节点，可能影响性能。建议使用筛选功能或切换到更适合的布局模式。
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={onOptimizeClick}
              style={{
                padding: '6px 10px',
                background: '#f59e0b',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Filter size={12} />
              优化显示
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
