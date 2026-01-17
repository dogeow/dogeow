import React from 'react'
import { Edit, Trash2 } from 'lucide-react'
import type { ThemeColors } from '../types/graph'

interface BottomActionBarProps {
  isAdmin: boolean
  themeColors: ThemeColors
  onEdit: () => void
  onDelete: () => void
}

export function NoteBottomActionBar({
  isAdmin,
  themeColors,
  onEdit,
  onDelete,
}: BottomActionBarProps) {
  if (!isAdmin) return null

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 12,
        left: 12,
        zIndex: 10,
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
      }}
    >
      <button
        onClick={onEdit}
        style={{
          padding: '8px 10px',
          border: `1px solid ${themeColors.border}`,
          borderRadius: 8,
          background: '#f59e0b',
          color: '#ffffff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Edit style={{ width: 16, height: 16 }} />
        编辑节点
      </button>
      <button
        onClick={onDelete}
        style={{
          padding: '8px 10px',
          border: `1px solid ${themeColors.border}`,
          borderRadius: 8,
          background: '#ef4444',
          color: '#ffffff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Trash2 style={{ width: 16, height: 16 }} />
        删除节点
      </button>
    </div>
  )
}
