'use client'

import Image from 'next/image'

import { useState, useCallback, memo } from 'react'
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
import { API_URL } from '@/lib/api'

interface TreeViewProps {
  folderTree: FolderNode[]
  files: CloudFile[]
}

interface FolderNodeComponentProps {
  node: FolderNode
  level: number
  expandedNodes: Record<number, boolean>
  toggleNode: (id: number) => void
  onSelectFolder: (id: number) => void
  currentFolderId: number | null
}

const FolderNodeComponent = memo<FolderNodeComponentProps>(({
  node,
  level,
  expandedNodes,
  toggleNode,
  onSelectFolder,
  currentFolderId
}) => {
  const isExpanded = expandedNodes[node.id] || false
  const isSelected = currentFolderId === node.id
  const hasChildren = node.children?.length > 0

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    toggleNode(node.id)
  }, [node.id, toggleNode])

  const handleSelect = useCallback(() => {
    onSelectFolder(node.id)
  }, [node.id, onSelectFolder])

  return (
    <div>
      <div 
        className={cn(
          "flex items-center py-2 px-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
          isSelected && "bg-muted/70 font-medium"
        )}
        style={{ paddingLeft: `${level * 12 + 4}px` }}
        onClick={handleSelect}
      >
        {hasChildren ? (
          <span 
            className="mr-1 p-1 rounded-sm hover:bg-muted" 
            onClick={handleToggle}
          >
            {isExpanded ? 
              <ChevronDown className="h-4 w-4 text-muted-foreground" /> : 
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            }
          </span>
        ) : (
          <span className="w-6" />
        )}
        
        {isExpanded ? 
          <FolderOpen className="h-4 w-4 text-yellow-500 mr-2" /> : 
          <Folder className="h-4 w-4 text-yellow-500 mr-2" />
        }
        
        <span className="truncate">{node.name}</span>
      </div>

      {isExpanded && hasChildren && (
        <div>
          {node.children.map(childNode => (
            <FolderNodeComponent
              key={childNode.id}
              node={childNode}
              level={level + 1}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
              onSelectFolder={onSelectFolder}
              currentFolderId={currentFolderId}
            />
          ))}
        </div>
      )}
    </div>
  )
})

FolderNodeComponent.displayName = 'FolderNodeComponent'

const FileIcon = memo<{ file: CloudFile }>(({ file }) => {
  if (file.is_folder) return <Folder className="h-4 w-4 text-yellow-500" />
  
  if (file.type === 'image') {
    return (
      <div className="w-5 h-5 relative overflow-hidden rounded-sm flex items-center justify-center bg-muted">
        <Image 
                      src={`${API_URL}/api/cloud/files/${file.id}/preview?thumb=true`} 
          alt={file.name} width={20} height={20} 
          className="object-cover w-full h-full"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            e.currentTarget.parentElement?.classList.add('flex')
            e.currentTarget.parentElement?.appendChild(
              Object.assign(document.createElement('div'), {
                className: 'flex items-center justify-center',
                innerHTML: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 text-blue-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><circle cx="10" cy="13" r="2"></circle><path d="m20 17-1.09-1.09a2 2 0 0 0-2.82 0L10 22"></path></svg>'
              })
            )
          }}
        />
      </div>
    )
  }
  
  const iconMap = {
    pdf: <FileType className="h-4 w-4 text-red-500" />,
    document: <FileText className="h-4 w-4 text-green-500" />,
    spreadsheet: <FileSpreadsheet className="h-4 w-4 text-green-500" />,
    archive: <FileArchive className="h-4 w-4 text-orange-500" />,
    audio: <FileAudio className="h-4 w-4 text-purple-500" />,
    video: <FileVideo className="h-4 w-4 text-pink-500" />,
  }
  
  return iconMap[file.type as keyof typeof iconMap] || <File className="h-4 w-4 text-gray-500" />
})

FileIcon.displayName = 'FileIcon'

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export default function TreeView({ folderTree, files }: TreeViewProps) {
  const { currentFolderId, navigateToFolder } = useFileStore()
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({})

  const toggleNode = useCallback((id: number) => {
    setExpandedNodes(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }, [])

  const expandToNode = useCallback((nodeId: number) => {
    const findAndExpandPath = (nodes: FolderNode[], targetId: number, path: number[] = []): number[] | null => {
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
        path.forEach(id => newExpanded[id] = true)
        return newExpanded
      })
    }
  }, [folderTree])

  const handleSelectFolder = useCallback((id: number) => {
    navigateToFolder(id)
  }, [navigateToFolder])

  const handleFileClick = useCallback((file: CloudFile) => {
    if (file.is_folder) {
      navigateToFolder(file.id)
      expandToNode(file.id)
    } else {
      window.open(`${API_URL}/api/cloud/files/${file.id}/download`, '_blank')
    }
  }, [navigateToFolder, expandToNode])

  return (
    <div className="flex h-[70vh]">
      <div className="w-1/3 overflow-auto border-r pr-2">
        <div className="font-medium text-sm mb-2">文件夹</div>
        <div 
          className={cn(
            "flex items-center py-2 px-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
            currentFolderId === null && "bg-muted/70 font-medium"
          )}
          onClick={() => navigateToFolder(null)}
        >
          <Folder className="h-4 w-4 text-yellow-500 mr-2" />
          <span>根目录</span>
        </div>
        
        {folderTree.map(node => (
          <FolderNodeComponent 
            key={node.id}
            node={node}
            level={1}
            expandedNodes={expandedNodes}
            toggleNode={toggleNode}
            onSelectFolder={handleSelectFolder}
            currentFolderId={currentFolderId}
          />
        ))}
      </div>

      {/* 右侧文件列表 */}
      <div className="flex-1 pl-4 overflow-auto">
        <div className="font-medium text-sm mb-2">
          {currentFolderId === null ? '根目录' : '文件'}
        </div>
        
        {files.length === 0 ? (
          <div className="text-muted-foreground text-sm mt-4">
            {currentFolderId === null ? '根目录为空' : '此文件夹为空'}
          </div>
        ) : (
          <div className="space-y-1">
            {files.map(file => (
              <div 
                key={file.id}
                className="flex items-center py-2 px-3 rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleFileClick(file)}
              >
                <FileIcon file={file} />
                <span className="ml-2 flex-1 truncate">{file.name}</span>
                {!file.is_folder && (
                  <span className="text-xs text-muted-foreground">
                    {formatSize(file.size)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 