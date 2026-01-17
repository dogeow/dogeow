import React from 'react'
import type { ThemeColors } from '../types/graph'

interface GraphEmptyStateProps {
  isAdmin: boolean
  themeColors: ThemeColors
}

export function NoteGraphEmptyState({ isAdmin, themeColors }: GraphEmptyStateProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        color: themeColors.mutedForeground,
      }}
    >
      <div style={{ fontSize: 18, marginBottom: 8 }}>图谱为空</div>
      <div style={{ fontSize: 14, marginBottom: 16 }}>
        {isAdmin ? '点击上方的「新建节点」按钮开始创建知识节点' : '暂无数据'}
      </div>
    </div>
  )
}
