import React from 'react'
import { Plus, Edit, Trash2, Link as LinkIcon } from 'lucide-react'
import type { NodeData, ThemeColors } from '../types'
import type { WikiNode } from '@/lib/api/wiki'

interface GraphToolbarProps {
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
  onClearSelection: () => void
}

export function GraphToolbar({
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
  onClearSelection,
}: GraphToolbarProps) {
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
      <input
        value={query}
        onChange={e => onQueryChange(e.target.value)}
        placeholder="搜索"
        style={{
          padding: '8px 10px',
          border: `1px solid ${themeColors.border}`,
          borderRadius: 8,
          minWidth: 260,
          background: themeColors.card,
          color: themeColors.foreground,
        }}
      />
      {query && (
        <button
          onClick={() => onQueryChange('')}
          style={{
            padding: '8px 10px',
            border: `1px solid ${themeColors.border}`,
            borderRadius: 8,
            background: themeColors.card,
            color: themeColors.foreground,
          }}
        >
          清空
        </button>
      )}
      {/* 管理员按钮 - 始终显示 */}
      {isAdmin && (
        <>
          <button
            onClick={onNewNode}
            style={{
              padding: '8px 10px',
              border: `1px solid ${themeColors.border}`,
              borderRadius: 8,
              background: '#10b981',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Plus style={{ width: 16, height: 16 }} />
            新建节点
          </button>
          <button
            onClick={onCreateLink}
            style={{
              padding: '8px 10px',
              border: `1px solid ${themeColors.border}`,
              borderRadius: 8,
              background: '#8b5cf6',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <LinkIcon style={{ width: 16, height: 16 }} />
            创建链接
          </button>
        </>
      )}
      {activeNode && (
        <>
          {isAdmin && (
            <>
              <button
                onClick={onEditNode}
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
                onClick={onDeleteNode}
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
            </>
          )}
          {activeNode.slug && (
            <button
              onClick={onViewArticle}
              style={{
                padding: '8px 10px',
                border: `1px solid ${themeColors.border}`,
                borderRadius: 8,
                background: '#2563eb',
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              查看文章
            </button>
          )}
          <button
            onClick={onClearSelection}
            style={{
              padding: '8px 10px',
              border: `1px solid ${themeColors.border}`,
              borderRadius: 8,
              background: themeColors.card,
              color: themeColors.foreground,
              cursor: 'pointer',
            }}
          >
            取消选中
          </button>
        </>
      )}
    </div>
  )
}
