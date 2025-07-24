'use client'

import Image from 'next/image'
import { useState, useCallback, memo, useMemo, useRef } from 'react'
import {
  ChevronRight,
  ChevronDown,
  File,
  FileText,
  FileArchive,
  FileAudio,
  FileVideo,
  FileType,
  FileSpreadsheet,
  Folder,
  FolderOpen,
} from 'lucide-react'
import { cn } from '@/lib/helpers'
import { CloudFile, FolderNode } from '../../types'
import useFileStore from '../../store/useFileStore'
import { getFilePreviewUrl, getFileDownloadUrl } from '../../services/api'
import { formatFileSize } from '../../constants'

// 常量定义
const CONSTANTS = {
  INDENT_SIZE: 8,
  BASE_PADDING: 2,
  ICON_SIZE: 'h-4 w-4',
  PREVIEW_SIZE: { width: 20, height: 20 },
  TREE_HEIGHT: 'h-[70vh]',
} as const

// 文件类型图标映射
const FILE_TYPE_ICONS = {
  pdf: { icon: FileType, color: 'text-red-500' },
  document: { icon: FileText, color: 'text-green-500' },
  spreadsheet: { icon: FileSpreadsheet, color: 'text-green-500' },
  archive: { icon: FileArchive, color: 'text-orange-500' },
  audio: { icon: FileAudio, color: 'text-purple-500' },
  video: { icon: FileVideo, color: 'text-pink-500' },
} as const

// 组件接口
interface TreeViewProps {
  folderTree: FolderNode[]
  files: CloudFile[]
  isLoading?: boolean
}

interface FolderNodeComponentProps {
  node: FolderNode
  level: number
  expandedNodes: Record<number, boolean>
  onToggleNode: (id: number) => void
  onSelectFolder: (id: number) => void
  currentFolderId: number | null
}

interface FileIconProps {
  file: CloudFile
  className?: string
}

// 优化的文件夹节点组件
const FolderNodeComponent = memo<FolderNodeComponentProps>(
  ({ node, level, expandedNodes, onToggleNode, onSelectFolder, currentFolderId }) => {
    const isExpanded = expandedNodes[node.id] || false
    const isSelected = currentFolderId === node.id
    const hasChildren = node.children?.length > 0
    const paddingLeft = level * CONSTANTS.INDENT_SIZE + CONSTANTS.BASE_PADDING

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
                <ChevronDown className={cn(CONSTANTS.ICON_SIZE, 'text-muted-foreground')} />
              ) : (
                <ChevronRight className={cn(CONSTANTS.ICON_SIZE, 'text-muted-foreground')} />
              )}
            </button>
          ) : (
            <span className="w-2" />
          )}

          {isExpanded ? (
            <FolderOpen className={cn(CONSTANTS.ICON_SIZE, 'mr-2 text-yellow-500')} />
          ) : (
            <Folder className={cn(CONSTANTS.ICON_SIZE, 'mr-2 text-yellow-500')} />
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

// 优化的文件图标组件
const FileIcon = memo<FileIconProps>(({ file, className }) => {
  const [imageError, setImageError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  if (file.is_folder) {
    return <Folder className={cn(CONSTANTS.ICON_SIZE, 'text-yellow-500', className)} />
  }

  if (file.type === 'image' && !imageError) {
    return (
      <div
        className={cn(
          'bg-muted relative flex h-5 w-5 items-center justify-center overflow-hidden rounded-sm',
          className
        )}
      >
        <Image
          ref={imgRef}
          src={getFilePreviewUrl(file.id)}
          alt={file.name}
          width={CONSTANTS.PREVIEW_SIZE.width}
          height={CONSTANTS.PREVIEW_SIZE.height}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
          loading="lazy"
          sizes="20px"
        />
      </div>
    )
  }

  const fileTypeConfig = FILE_TYPE_ICONS[file.type as keyof typeof FILE_TYPE_ICONS]
  if (fileTypeConfig) {
    const { icon: IconComponent, color } = fileTypeConfig
    return <IconComponent className={cn(CONSTANTS.ICON_SIZE, color, className)} />
  }

  return <File className={cn(CONSTANTS.ICON_SIZE, 'text-gray-500', className)} />
})

FileIcon.displayName = 'FileIcon'

// 文件项组件
const FileItem = memo<{ file: CloudFile; onClick: (file: CloudFile) => void }>(
  ({ file, onClick }) => {
    const handleClick = useCallback(() => {
      onClick(file)
    }, [file, onClick])

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(file)
        }
      },
      [file, onClick]
    )

    return (
      <div
        className="hover:bg-muted/50 focus:ring-primary/30 flex cursor-pointer items-center rounded-md px-3 py-2 transition-colors focus:ring-1 focus:outline-none"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`${file.is_folder ? '文件夹' : '文件'}: ${file.name}`}
      >
        <FileIcon file={file} />
        <span className="ml-2 flex-1 truncate" title={file.name}>
          {file.name}
        </span>
        {!file.is_folder && (
          <span className="text-muted-foreground ml-2 text-xs">{formatFileSize(file.size)}</span>
        )}
      </div>
    )
  }
)

FileItem.displayName = 'FileItem'

// 主组件
export default function TreeView({ folderTree, files, isLoading = false }: TreeViewProps) {
  const { currentFolderId, navigateToFolder } = useFileStore()
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({})

  const toggleNode = useCallback((id: number) => {
    setExpandedNodes(prev => ({
      ...prev,
      [id]: !prev[id],
    }))
  }, [])

  const expandToNode = useCallback(
    (nodeId: number) => {
      const findAndExpandPath = (
        nodes: FolderNode[],
        targetId: number,
        path: number[] = []
      ): number[] | null => {
        for (const node of nodes) {
          if (node.id === targetId) return [...path, node.id]
          if (node.children?.length) {
            const foundPath = findAndExpandPath(node.children, targetId, [...path, node.id])
            if (foundPath) return foundPath
          }
        }
        return null
      }

      const path = findAndExpandPath(folderTree, nodeId)
      if (path) {
        setExpandedNodes(prev => {
          const newExpanded = { ...prev }
          path.forEach(id => (newExpanded[id] = true))
          return newExpanded
        })
      }
    },
    [folderTree]
  )

  const handleSelectFolder = useCallback(
    (id: number) => {
      navigateToFolder(id)
    },
    [navigateToFolder]
  )

  const handleFileClick = useCallback(
    (file: CloudFile) => {
      if (file.is_folder) {
        navigateToFolder(file.id)
        expandToNode(file.id)
      } else {
        window.open(getFileDownloadUrl(file.id), '_blank')
      }
    },
    [navigateToFolder, expandToNode]
  )

  const handleRootFolderClick = useCallback(() => {
    navigateToFolder(null)
  }, [navigateToFolder])

  const handleRootFolderKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        navigateToFolder(null)
      }
    },
    [navigateToFolder]
  )

  // 优化的文件夹树渲染
  const folderTreeElements = useMemo(
    () =>
      folderTree.map(node => (
        <FolderNodeComponent
          key={node.id}
          node={node}
          level={1}
          expandedNodes={expandedNodes}
          onToggleNode={toggleNode}
          onSelectFolder={handleSelectFolder}
          currentFolderId={currentFolderId}
        />
      )),
    [folderTree, expandedNodes, toggleNode, handleSelectFolder, currentFolderId]
  )

  // 优化的文件列表渲染
  const fileElements = useMemo(
    () => files.map(file => <FileItem key={file.id} file={file} onClick={handleFileClick} />),
    [files, handleFileClick]
  )

  const currentFolderName = useMemo(() => {
    if (currentFolderId === null) return '根目录'

    const findNodeName = (nodes: FolderNode[], targetId: number): string | null => {
      for (const node of nodes) {
        if (node.id === targetId) return node.name
        if (node.children?.length) {
          const foundName = findNodeName(node.children, targetId)
          if (foundName) return foundName
        }
      }
      return null
    }

    return findNodeName(folderTree, currentFolderId) || '未知文件夹'
  }, [currentFolderId, folderTree])

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center', CONSTANTS.TREE_HEIGHT)}>
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  return (
    <div className={cn('flex', CONSTANTS.TREE_HEIGHT)}>
      {/* 左侧文件夹树 */}
      <div className="w-1/3 overflow-auto border-r pr-2" role="tree" aria-label="文件夹树">
        <div className="mb-2 text-sm font-medium">文件夹</div>

        {/* 根目录 */}
        <div
          className={cn(
            'hover:bg-muted/50 focus:ring-primary/30 flex cursor-pointer items-center rounded-md px-2 py-2 transition-colors focus:ring-1 focus:outline-none',
            currentFolderId === null && 'bg-muted/70 font-medium'
          )}
          onClick={handleRootFolderClick}
          onKeyDown={handleRootFolderKeyDown}
          tabIndex={0}
          role="treeitem"
          aria-selected={currentFolderId === null}
          aria-label="根目录"
        >
          <Folder className={cn(CONSTANTS.ICON_SIZE, 'mr-2 text-yellow-500')} />
          <span>根目录</span>
        </div>

        {folderTreeElements}
      </div>

      {/* 右侧文件列表 */}
      <div className="flex-1 overflow-auto pl-4" role="list" aria-label="文件列表">
        <div className="mb-2 text-sm font-medium">{currentFolderName}</div>

        {files.length === 0 ? (
          <div className="text-muted-foreground mt-4 text-sm" role="status">
            {currentFolderId === null ? '根目录为空' : '此文件夹为空'}
          </div>
        ) : (
          <div className="space-y-1">{fileElements}</div>
        )}
      </div>
    </div>
  )
}
