'use client'

import { memo } from 'react'
import { Search, Plus, Pencil, Trash2, Link as LinkIcon, FileText, Edit3, X } from 'lucide-react'
import type { NodeData, ThemeColors } from '../types/graph'

interface GraphViewToolbarProps {
  query: string
  onQueryChange: () => void
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

const NoteGraphToolbar = memo(
  ({
    query,
    onQueryChange,
    isAdmin,
    activeNode,
    nodes,
    themeColors,
    onNewNode,
    onEditNode,
    onDeleteNode,
    onCreateLink,
    onViewArticle,
    onEditArticle,
    onClearSelection,
  }: GraphViewToolbarProps) => {
    const hasSelection = activeNode !== null

    return (
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {/* 搜索框 */}
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 items-center rounded-lg border px-3 py-2"
            style={{
              backgroundColor: themeColors.card,
              borderColor: themeColors.border,
              color: themeColors.foreground,
            }}
          >
            <Search className="mr-2 h-4 w-4" style={{ color: themeColors.mutedForeground }} />
            <input
              type="text"
              value={query}
              onChange={onQueryChange}
              placeholder="搜索节点..."
              className="min-w-[120px] border-none bg-transparent text-sm focus:outline-none"
              style={{ color: themeColors.foreground }}
            />
          </div>
        </div>

        {/* 操作按钮 */}
        {isAdmin && (
          <div className="flex flex-col gap-1">
            <button
              onClick={onNewNode}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500 text-white transition-colors hover:bg-green-600"
              title="新建节点"
            >
              <Plus className="h-4 w-4" />
            </button>

            <button
              onClick={onCreateLink}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500 text-white transition-colors hover:bg-purple-600"
              title="创建链接"
            >
              <LinkIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* 选中节点的操作 */}
        {hasSelection && (
          <div
            className="flex flex-col gap-1 rounded-lg p-2"
            style={{
              backgroundColor: themeColors.card,
              borderColor: themeColors.border,
            }}
          >
            {activeNode && (
              <div
                className="mb-2 max-w-[150px] truncate text-xs font-medium"
                style={{ color: themeColors.foreground }}
              >
                {activeNode.title}
              </div>
            )}

            <button
              onClick={onViewArticle}
              className="hover:bg-accent flex h-8 w-8 items-center justify-center rounded transition-colors"
              style={{ color: themeColors.primary }}
              title="查看文章"
            >
              <FileText className="h-4 w-4" />
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={onEditNode}
                  className="hover:bg-accent flex h-8 w-8 items-center justify-center rounded transition-colors"
                  style={{ color: themeColors.primary }}
                  title="编辑节点"
                >
                  <Edit3 className="h-4 w-4" />
                </button>

                <button
                  onClick={onDeleteNode}
                  className="hover:bg-accent flex h-8 w-8 items-center justify-center rounded transition-colors"
                  style={{ color: '#ef4444' }}
                  title="删除节点"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}

            <button
              onClick={onClearSelection}
              className="hover:bg-accent flex h-8 w-8 items-center justify-center rounded transition-colors"
              style={{ color: themeColors.mutedForeground }}
              title="取消选择"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* 节点数量 */}
        <div
          className="rounded-lg px-2 py-1 text-xs"
          style={{
            backgroundColor: themeColors.card,
            color: themeColors.mutedForeground,
            borderColor: themeColors.border,
          }}
        >
          {nodes.length} 节点
        </div>
      </div>
    )
  }
)

NoteGraphToolbar.displayName = 'NoteGraphToolbar'

export default NoteGraphToolbar
