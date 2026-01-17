import React, { memo, useMemo } from 'react'
import { RootFolderItem } from './RootFolderItem'
import { FolderNodeComponent } from './FolderNodeComponent'
import type { FolderNode } from '../../../../types'

interface FolderTreeProps {
  folderTree: FolderNode[]
  expandedNodes: Record<number, boolean>
  currentFolderId: number | null
  onToggleNode: (id: number) => void
  onSelectFolder: (id: number) => void
  onRootFolderClick: () => void
  onRootFolderKeyDown: (e: React.KeyboardEvent) => void
}

export const FolderTree = memo<FolderTreeProps>(
  ({
    folderTree,
    expandedNodes,
    currentFolderId,
    onToggleNode,
    onSelectFolder,
    onRootFolderClick,
    onRootFolderKeyDown,
  }) => {
    const folderTreeElements = useMemo(
      () =>
        folderTree.map(node => (
          <FolderNodeComponent
            key={node.id}
            node={node}
            level={1}
            expandedNodes={expandedNodes}
            onToggleNode={onToggleNode}
            onSelectFolder={onSelectFolder}
            currentFolderId={currentFolderId}
          />
        )),
      [folderTree, expandedNodes, onToggleNode, onSelectFolder, currentFolderId]
    )

    return (
      <div className="w-1/3 overflow-auto border-r pr-2" role="tree" aria-label="文件夹树">
        <div className="mb-2 text-sm font-medium">文件夹</div>

        <RootFolderItem
          isSelected={currentFolderId === null}
          onClick={onRootFolderClick}
          onKeyDown={onRootFolderKeyDown}
        />

        {folderTreeElements}
      </div>
    )
  }
)

FolderTree.displayName = 'FolderTree'
