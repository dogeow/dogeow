'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  File,
  FileText,
  FileArchive,
  FileAudio,
  FileVideo,
  FileType,
  FileSpreadsheet,
  Folder,
  MoreVertical,
  Download,
  Pencil,
  Trash2,
} from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from 'react-hot-toast'
import { useSWRConfig } from 'swr'
import { cn } from '@/lib/helpers'
import { CloudFile, FilePreviewResponse } from '../../types'
import { apiRequest, put, del } from '@/lib/api'
import useFileStore from '../../store/useFileStore'
import { API_URL } from '@/lib/api'
import Image from "next/image"

interface GridViewProps {
  files: CloudFile[]
}

// 文件类型图标映射
const FILE_TYPE_ICONS = {
  pdf: { icon: FileType, color: 'text-red-500' },
  document: { icon: FileText, color: 'text-green-500' },
  spreadsheet: { icon: FileSpreadsheet, color: 'text-green-500' },
  archive: { icon: FileArchive, color: 'text-orange-500' },
  audio: { icon: FileAudio, color: 'text-purple-500' },
  video: { icon: FileVideo, color: 'text-pink-500' },
  default: { icon: File, color: 'text-gray-500' }
} as const

// 文件大小单位
const SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const

// 预览类型常量
const PREVIEW_TYPES = {
  LOADING: 'loading',
  IMAGE: 'image',
  PDF: 'pdf',
  TEXT: 'text',
  DOCUMENT: 'document',
  UNKNOWN: 'unknown'
} as const

// 文件图标组件
const FileIcon = ({ file }: { file: CloudFile }) => {
  if (file.is_folder) {
    return <Folder className="h-12 w-12 text-yellow-500" />
  }
  
  if (file.type === 'image') {
    const storageUrl = `${API_URL}/storage/${file.path}?t=${Date.now()}`
    
    return (
      <div className="w-16 h-16 relative overflow-hidden rounded-md flex items-center justify-center bg-muted">
        <Image 
          src={storageUrl}
          alt={file.name}
          fill
          className="object-cover"
          loading="lazy"
          onError={() => console.error('图片加载失败:', file.name)}
        />
      </div>
    )
  }
  
  const iconConfig = FILE_TYPE_ICONS[file.type as keyof typeof FILE_TYPE_ICONS] || FILE_TYPE_ICONS.default
  const IconComponent = iconConfig.icon
  return <IconComponent className={`h-12 w-12 ${iconConfig.color}`} />
}

export default function GridView({ files }: GridViewProps) {
  const { mutate } = useSWRConfig()
  const { currentFolderId, navigateToFolder, selectedFiles, setSelectedFiles } = useFileStore()
  
  // 编辑状态
  const [editingFile, setEditingFile] = useState<CloudFile | null>(null)
  const [fileName, setFileName] = useState('')
  const [fileDescription, setFileDescription] = useState('')
  const [previewFile, setPreviewFile] = useState<CloudFile | null>(null)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<string | null>(null)

  // 工具函数 - 使用 useCallback 优化性能
  const formatSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${SIZE_UNITS[i]}`
  }, [])

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [])

  // SWR key 生成器
  const getSWRKey = useCallback(() => {
    return `/cloud/files?parent_id=${currentFolderId || ''}`
  }, [currentFolderId])

  // 事件处理器 - 使用 useCallback 优化性能
  const toggleSelection = useCallback((fileId: number, event: React.MouseEvent) => {
    event.stopPropagation()
    setSelectedFiles(
      selectedFiles.includes(fileId) 
        ? selectedFiles.filter(id => id !== fileId)
        : [...selectedFiles, fileId]
    )
  }, [selectedFiles, setSelectedFiles])

  const handleItemClick = useCallback((file: CloudFile) => {
    if (file.is_folder) {
      navigateToFolder(file.id)
    } else {
      previewItem(file)
    }
  }, [navigateToFolder])

  const downloadFile = useCallback(async (file: CloudFile) => {
    try {
      window.open(`${API_URL}/api/cloud/files/${file.id}/download`, '_blank')
      toast.success('开始下载')
    } catch (error) {
      toast.error('下载失败')
      console.error('Download error:', error)
    }
  }, [])

  const deleteFile = useCallback(async (file: CloudFile) => {
    try {
      await del(`/cloud/files/${file.id}`)
      mutate(key => typeof key === 'string' && key.startsWith(getSWRKey()))
      toast.success('删除成功')
    } catch (error) {
      toast.error('删除失败')
      console.error('Delete error:', error)
    }
  }, [mutate, getSWRKey])

  const openEditDialog = useCallback((file: CloudFile, event: React.MouseEvent) => {
    event.stopPropagation()
    setEditingFile(file)
    setFileName(file.name)
    setFileDescription(file.description || '')
  }, [])

  const updateFile = useCallback(async () => {
    if (!editingFile || !fileName.trim()) return

    try {
      await put(`/cloud/files/${editingFile.id}`, {
        name: fileName.trim(),
        description: fileDescription.trim()
      })
      
      mutate(key => typeof key === 'string' && key.startsWith(getSWRKey()))
      toast.success('更新成功')
      setEditingFile(null)
    } catch (error) {
      toast.error('更新失败')
      console.error('Update error:', error)
    }
  }, [editingFile, fileName, fileDescription, mutate, getSWRKey])

  const previewItem = useCallback(async (file: CloudFile) => {
    if (file.is_folder) return

    setPreviewFile(file)
    setPreviewContent(null)
    setPreviewUrl(null)
    setPreviewType(PREVIEW_TYPES.LOADING)

    try {
      if (file.type === 'image') {
        const directUrl = `${API_URL}/storage/${file.path}?t=${Date.now()}`
        setPreviewType(PREVIEW_TYPES.IMAGE)
        setPreviewUrl(directUrl)
        return
      }
      
      const response = await apiRequest<FilePreviewResponse>(`/cloud/files/${file.id}/preview`)
      const { type, content, url } = response

      setPreviewType(type)
      
      if (type === PREVIEW_TYPES.IMAGE || type === PREVIEW_TYPES.PDF) {
        setPreviewUrl(url ?? null)
      } else if (type === PREVIEW_TYPES.TEXT) {
        setPreviewContent(content ?? null)
      } else {
        setPreviewContent(JSON.stringify(response))
      }
    } catch (error) {
      toast.error('预览失败')
      console.error('Preview error:', error)
      setPreviewType(PREVIEW_TYPES.UNKNOWN)
      setPreviewContent(JSON.stringify({
        message: '预览失败，请稍后重试',
        suggestion: '您可以尝试下载文件后查看'
      }))
    }
  }, [])

  const closePreview = useCallback(() => {
    setPreviewFile(null)
    setPreviewContent(null)
    setPreviewUrl(null)
    setPreviewType(null)
  }, [])

  const closeEditDialog = useCallback(() => {
    setEditingFile(null)
    setFileName('')
    setFileDescription('')
  }, [])

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {files.map(file => (
          <div
            key={file.id}
            className={cn(
              "flex flex-col items-center p-4 rounded-lg border cursor-pointer transition-colors shadow-sm",
              "bg-card hover:bg-accent/50 border-border",
              selectedFiles.includes(file.id) && "ring-2 ring-primary border-primary"
            )}
            onClick={() => handleItemClick(file)}
          >
                      <div className="relative">
            <FileIcon file={file} />
            <input
                type="checkbox"
                className="absolute -top-2 -left-2 h-4 w-4 rounded-sm border border-primary"
                checked={selectedFiles.includes(file.id)}
                onChange={() => {}}
                onClick={(e) => toggleSelection(file.id, e)}
              />
            </div>
            
            <div className="mt-2 text-center">
              <p className="font-medium text-sm truncate max-w-[8rem] text-foreground" title={file.name}>
                {file.name}
              </p>
              {!file.is_folder && (
                <p className="text-xs text-muted-foreground">
                  {formatSize(file.size)}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(file.created_at)}
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!file.is_folder && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    downloadFile(file)
                  }}>
                    <Download className="h-4 w-4 mr-2" />
                    下载
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem onClick={(e) => openEditDialog(file, e)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  重命名
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteFile(file)
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      {/* 编辑文件对话框 */}
      {editingFile && (
        <Dialog open={!!editingFile} onOpenChange={(open) => !open && closeEditDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                编辑{editingFile.is_folder ? '文件夹' : '文件'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">名称</Label>
                <Input
                  id="edit-name"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="请输入文件名"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">描述 (可选)</Label>
                <Textarea
                  id="edit-description"
                  value={fileDescription}
                  onChange={(e) => setFileDescription(e.target.value)}
                  placeholder="请输入文件描述"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">取消</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button onClick={updateFile} disabled={!fileName.trim()}>
                  保存
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 文件预览对话框 */}
      {previewFile && (
        <Dialog open={!!previewFile} onOpenChange={(open) => !open && closePreview()}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between pr-12">
                <span className="truncate">{previewFile.name}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => downloadFile(previewFile)}
                  className="ml-2 shrink-0"
                >
                  <Download className="h-4 w-4 mr-2" />
                  下载
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="min-h-[60vh] flex items-center justify-center py-4">
              {previewType === PREVIEW_TYPES.LOADING && (
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-12 w-12 bg-muted rounded-full"></div>
                  <div className="mt-4 h-4 w-32 bg-muted rounded"></div>
                </div>
              )}

              {previewType === PREVIEW_TYPES.IMAGE && previewUrl && (
                <Image
                  src={previewUrl}
                  alt={previewFile.name}
                  width={800}
                  height={600}
                  className="max-h-[60vh] max-w-full object-contain"
                />
              )}

              {previewType === PREVIEW_TYPES.PDF && previewUrl && (
                <div className="w-full h-[60vh] flex flex-col">
                  <div className="flex-1 relative">
                    <iframe
                      src={previewUrl}
                      className="w-full h-full border-0"
                      title={previewFile.name}
                      onError={() => console.error('PDF iframe failed to load')}
                    />
                  </div>
                  <div className="mt-2 text-center text-sm text-muted-foreground">
                    如果PDF无法显示，请{' '}
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-sm"
                      onClick={() => window.open(previewUrl, '_blank')}
                    >
                      在新窗口中打开
                    </Button>
                    {' '}或{' '}
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-sm"
                      onClick={() => downloadFile(previewFile)}
                    >
                      下载文件
                    </Button>
                  </div>
                </div>
              )}

              {previewType === PREVIEW_TYPES.TEXT && previewContent && !previewContent.startsWith('{') && (
                <pre className="w-full h-full max-h-[60vh] overflow-auto bg-muted p-4 rounded text-sm">
                  {previewContent}
                </pre>
              )}

              {(previewType === PREVIEW_TYPES.DOCUMENT || previewType === PREVIEW_TYPES.UNKNOWN) && previewContent && (
                <div className="text-center max-w-md mx-auto">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto" />
                  {(() => {
                    try {
                      const response = JSON.parse(previewContent)
                      return (
                        <>
                          <p className="mt-4 text-muted-foreground font-medium">
                            {response.message || '此文件类型不支持预览'}
                          </p>
                          {response.suggestion && (
                            <p className="mt-2 text-sm text-muted-foreground">
                              {response.suggestion}
                            </p>
                          )}
                        </>
                      )
                    } catch {
                      return (
                        <p className="mt-4 text-muted-foreground">此文件类型不支持预览</p>
                      )
                    }
                  })()}
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => downloadFile(previewFile)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    下载文件
                  </Button>
                </div>
              )}

              {/* 默认情况 */}
              {previewType && ![PREVIEW_TYPES.LOADING, PREVIEW_TYPES.IMAGE, PREVIEW_TYPES.PDF, PREVIEW_TYPES.TEXT, PREVIEW_TYPES.DOCUMENT, PREVIEW_TYPES.UNKNOWN].includes(previewType as any) && (
                <div className="text-center">
                  <File className="h-16 w-16 text-muted-foreground mx-auto" />
                  <p className="mt-4 text-muted-foreground">此文件类型不支持预览</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => downloadFile(previewFile)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    下载文件
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
} 