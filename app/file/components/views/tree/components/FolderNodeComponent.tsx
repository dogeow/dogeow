import React, { memo, useCallback } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/helpers'
import { TREE_CONSTANTS } from '../constants'
import type { FolderNode } from '../../../../types'

interface FolderNodeComponentProps {
  node: FolderNode
  level: number
  expandedNodes: Record<number, boolean>
  onToggleNode: (id: number) => void
  onSelectFolder: (id: number) => void
  currentFolderId: number | null
}

export const FolderNodeComponent = memo<FolderNodeComponentProps>(
  ({ node, level, expandedNodes, onToggleNode, onSelectFolder, currentFolderId }) => {
    const isExpanded = expandedNodes[node.id] || false
    const isSelected = currentFolderId === node.id
    const hasChildren = node.children?.length > 0
    const paddingLeft = level * TREE_CONSTANTS.INDENT_SIZE + TREE_CONSTANTS.BASE_PADDING

    const handleToggle = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()
        onToggleNode(node.id)
      },
      [node.id, onToggleNode]
    )

    const handleSelect = useCallback(() => {
      onSelectFolder(node.id)
    }, [node.id, onSelectFolder])

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelectFolder(node.id)
        } else if (e.key === 'ArrowRight' && hasChildren && !isExpanded) {
          e.preventDefault()
          onToggleNode(node.id)
        } else if (e.key === 'ArrowLeft' && hasChildren && isExpanded) {
          e.preventDefault()
          onToggleNode(node.id)
        }
      },
      [node.id, onSelectFolder, onToggleNode, hasChildren, isExpanded]
    )

    return (
      <div>
        <div
          className={cn(
            'hover:bg-muted/50 focus:ring-primary/30 flex cursor-pointer items-center rounded-md px-2 py-2 transition-colors focus:ring-1 focus:outline-none',
            isSelected && 'bg-muted/70 font-medium'
          )}
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={handleSelect}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="treeitem"
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-selected={isSelected}
          aria-label={`文件夹: ${node.name}`}
        >
          {hasChildren ? (
            <button
              className="hover:bg-muted focus:ring-primary/30 mr-1 rounded-sm p-1 focus:ring-1 focus:outline-none"
              onClick={handleToggle}
              aria-label={isExpanded ? '收起文件夹' : '展开文件夹'}
              tabIndex={-1}
            >
              {isExpanded ? (
                <ChevronDown className={cn(TREE_CONSTANTS.ICON_SIZE, 'text-muted-foreground')} />
              ) : (
                <ChevronRight className={cn(TREE_CONSTANTS.ICON_SIZE, 'text-muted-foreground')} />
              )}
            </button>
          ) : (
            <span className="w-2" />
          )}

          {isExpanded ? (
            <FolderOpen className={cn(TREE_CONSTANTS.ICON_SIZE, 'mr-2 text-yellow-500')} />
          ) : (
            <Folder className={cn(TREE_CONSTANTS.ICON_SIZE, 'mr-2 text-yellow-500')} />
          )}

          <span className="truncate" title={node.name}>
            {node.name}
          </span>
        </div>

        {isExpanded && hasChildren && (
          <div role="group">
            {node.children.map(childNode => (
              <FolderNodeComponent
                key={childNode.id}
                node={childNode}
                level={level + 1}
                expandedNodes={expandedNodes}
                onToggleNode={onToggleNode}
                onSelectFolder={onSelectFolder}
                currentFolderId={currentFolderId}
              />
            ))}
          </div>
        )}
      </div>
    )
  }
)

FolderNodeComponent.displayName = 'FolderNodeComponent'
