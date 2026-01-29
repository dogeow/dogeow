import React from 'react'
import type { NodeData, ThemeColors } from '../types/graph'

interface NoteGraphToolbarProps {
  query: string
  onQueryChange: (value: string) => void
  isAdmin: boolean
  activeNode: NodeData | null
  nodes: NodeData[]
  themeColors: ThemeColors
  onNewNode: () => void
  onEditNode: () => void
  onDeleteNode: () => void
  onCreateLink: () => void
  onViewArticle: () => void
  onEditArticle: () => void
  onClearSelection: () => void
}

export function NoteGraphToolbar({
  query,
  onQueryChange,
  isAdmin,
  activeNode,
  themeColors,
  onNewNode,
  onEditNode,
  onDeleteNode,
  onCreateLink,
  onViewArticle,
  onEditArticle,
  onClearSelection,
}: NoteGraphToolbarProps) {
  // 这些 props 保留以保持接口兼容性，但不再使用
  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 10,
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
      }}
    >
      {/* 搜索框和新建/创建链接按钮已移到 page.tsx 的 header 中 */}
      {/* 节点操作按钮已移到下方的 NoteNodeActionPanel */}
    </div>
  )
}
