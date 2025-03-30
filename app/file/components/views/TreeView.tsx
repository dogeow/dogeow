'use client'

import { useState } from 'react'
import {
  ChevronRight,
  ChevronDown,
  File,
  FileText,
  FileImage,
  FileArchive,
  FileAudio,
  FileVideo,
  FileType,
  FileSpreadsheet,
  Folder,
  FolderOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CloudFile, FolderNode } from '../../types'
import useFileStore from '../../store/useFileStore'

// 后端API基础URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

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

const FolderNodeComponent: React.FC<FolderNodeComponentProps> = ({
  node,
  level,
  expandedNodes,
  toggleNode,
  onSelectFolder,
  currentFolderId
}) => {
  const isExpanded = expandedNodes[node.id] || false
  const isSelected = currentFolderId === node.id
  const hasChildren = node.children && node.children.length > 0

  return (
    <div>
      <div 
        className={cn(
          "flex items-center py-2 px-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
          isSelected && "bg-muted/70 font-medium"
        )}
        style={{ paddingLeft: `${level * 12 + 4}px` }}
        onClick={() => onSelectFolder(node.id)}
      >
        {hasChildren ? (
          <span 
            className="mr-1 p-1 rounded-sm hover:bg-muted" 
            onClick={(e) => {
              e.stopPropagation()
              toggleNode(node.id)
            }}
          >
            {isExpanded ? 
              <ChevronDown className="h-4 w-4 text-muted-foreground" /> : 
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            }
          </span>
        ) : (
          <span className="w-6"></span>
        )}
        
        {isExpanded ? 
          <FolderOpen className="h-4 w-4 text-yellow-500 mr-2" /> : 
          <Folder className="h-4 w-4 text-yellow-500 mr-2" />
        }
        
        <span className="truncate">{node.name}</span>
      </div>

      {isExpanded && node.children && node.children.length > 0 && (
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
}

export default function TreeView({ folderTree, files }: TreeViewProps) {
  const { currentFolderId, navigateToFolder } = useFileStore()
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({})

  // 获取文件图标或缩略图
  const getFileIcon = (file: CloudFile) => {
    if (file.is_folder) return <Folder className="h-4 w-4 text-yellow-500" />
    
    // 如果是图片，显示缩略图
    if (file.type === 'image') {
      return (
        <div className="w-5 h-5 relative overflow-hidden rounded-sm flex items-center justify-center bg-muted">
          <img 
            src={`${API_BASE_URL}/cloud/files/${file.id}/preview?thumb=true`} 
            alt={file.name} 
            className="object-cover w-full h-full"
            onError={(e) => {
              // 如果缩略图加载失败，显示默认图标
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.classList.add('flex');
              e.currentTarget.parentElement?.appendChild(
                Object.assign(document.createElement('div'), {
                  className: 'flex items-center justify-center',
                  innerHTML: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 text-blue-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><circle cx="10" cy="13" r="2"></circle><path d="m20 17-1.09-1.09a2 2 0 0 0-2.82 0L10 22"></path></svg>'
                })
              );
            }}
          />
        </div>
      );
    }
    
    switch (file.type) {
      case 'pdf':
        return <FileType className="h-4 w-4 text-red-500" />
      case 'document':
        return <FileText className="h-4 w-4 text-green-500" />
      case 'spreadsheet':
        return <FileSpreadsheet className="h-4 w-4 text-green-500" />
      case 'archive':
        return <FileArchive className="h-4 w-4 text-orange-500" />
      case 'audio':
        return <FileAudio className="h-4 w-4 text-purple-500" />
      case 'video':
        return <FileVideo className="h-4 w-4 text-pink-500" />
      default:
        return <File className="h-4 w-4 text-gray-500" />
    }
  }

  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  // 切换节点展开/折叠状态
  const toggleNode = (id: number) => {
    setExpandedNodes(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // 自动展开当前选中文件夹的父节点
  const expandToNode = (nodeId: number) => {
    // 递归查找节点并展开路径
    const findAndExpandPath = (nodes: FolderNode[], targetId: number, path: number[] = []): number[] | null => {
      for (const node of nodes) {
        if (node.id === targetId) {
          return [...path, node.id]
        }
        
        if (node.children && node.children.length > 0) {
          const foundPath = findAndExpandPath(node.children, targetId, [...path, node.id])
          if (foundPath) {
            return foundPath
          }
        }
      }
      
      return null
    }
    
    const path = findAndExpandPath(folderTree, nodeId)
    if (path) {
      const newExpanded = { ...expandedNodes }
      path.forEach(id => {
        newExpanded[id] = true
      })
      setExpandedNodes(newExpanded)
    }
  }

  // 选择文件夹
  const handleSelectFolder = (id: number) => {
    navigateToFolder(id)
  }

  // 处理文件点击
  const handleFileClick = (file: CloudFile) => {
    if (file.is_folder) {
      navigateToFolder(file.id)
      expandToNode(file.id)
    } else {
      // 下载文件
      window.open(`${API_BASE_URL}/cloud/files/${file.id}/download`, '_blank')
    }
  }

  return (
    <div className="flex h-[70vh]">
      {/* 左侧文件夹树 */}
      <div className="w-1/3 overflow-auto border-r pr-2">
        <div className="font-medium text-sm mb-2">文件夹</div>
        {/* 根目录 */}
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
        
        {/* 文件夹树 */}
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
                {getFileIcon(file)}
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