'use client'

import { useState, useEffect } from 'react'
import {
  File,
  FileText,
  FileImage,
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
  ExternalLink
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
import { cn } from '@/lib/utils'
import { CloudFile } from '../../types'
import { apiRequest, put, del } from '@/utils/api'
import useFileStore from '../../store/useFileStore'
import { API_URL } from '@/utils/api'

interface GridViewProps {
  files: CloudFile[]
}

export default function GridView({ files }: GridViewProps) {
  const { mutate } = useSWRConfig()
  const { currentFolderId, navigateToFolder, selectedFiles, setSelectedFiles } = useFileStore()
  const [editingFile, setEditingFile] = useState<CloudFile | null>(null)
  const [fileName, setFileName] = useState('')
  const [fileDescription, setFileDescription] = useState('')
  const [previewFile, setPreviewFile] = useState<CloudFile | null>(null)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<string | null>(null)

  // 切换选择文件
  const toggleSelection = (fileId: number, event: React.MouseEvent) => {
    event.stopPropagation()
    
    if (selectedFiles.includes(fileId)) {
      setSelectedFiles(selectedFiles.filter(id => id !== fileId))
    } else {
      setSelectedFiles([...selectedFiles, fileId])
    }
  }

  // 获取文件图标或缩略图
  const getFileIcon = (file: CloudFile) => {
    if (file.is_folder) return <Folder className="h-12 w-12 text-yellow-500" />
    
    // 如果是图片类型，直接显示缩略图
    if (file.type === 'image') {
      // 直接构造存储URL而不是通过API获取
      const baseUrl = '127.0.0.1:8000'; // 后端API基础URL
      const storageUrl = `http://${baseUrl}/storage/${file.path}?t=${new Date().getTime()}`;
      
      return (
        <div className="w-16 h-16 relative overflow-hidden rounded-md flex items-center justify-center bg-muted">
          <img 
            src={storageUrl}
            alt={file.name} 
            className="object-cover w-full h-full"
            loading="lazy"
            onLoad={() => console.log('图片加载成功:', file.name)}
            onError={(e) => {
              console.error('图片加载失败:', file.name);
              console.error('图片URL:', storageUrl);
              
              // 显示默认图标
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.classList.add('flex');
              e.currentTarget.parentElement?.appendChild(
                Object.assign(document.createElement('div'), {
                  className: 'flex-center',
                  innerHTML: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-12 w-12 text-blue-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><circle cx="10" cy="13" r="2"></circle><path d="m20 17-1.09-1.09a2 2 0 0 0-2.82 0L10 22"></path></svg>'
                })
              );
            }}
          />
        </div>
      );
    }
    
    switch (file.type) {
      case 'pdf':
        return <FileType className="h-12 w-12 text-red-500" />
      case 'document':
        return <FileText className="h-12 w-12 text-green-500" />
      case 'spreadsheet':
        return <FileSpreadsheet className="h-12 w-12 text-green-500" />
      case 'archive':
        return <FileArchive className="h-12 w-12 text-orange-500" />
      case 'audio':
        return <FileAudio className="h-12 w-12 text-purple-500" />
      case 'video':
        return <FileVideo className="h-12 w-12 text-pink-500" />
      default:
        return <File className="h-12 w-12 text-gray-500" />
    }
  }

  // 获取格式化的文件大小
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 处理文件/文件夹点击
  const handleItemClick = (file: CloudFile) => {
    if (file.is_folder) {
      navigateToFolder(file.id)
    } else {
      previewItem(file)
    }
  }

  // 下载文件
  const downloadFile = async (file: CloudFile) => {
    try {
      window.open(`${API_URL}/cloud/files/${file.id}/download`, '_blank')
      toast.success('开始下载')
    } catch (error) {
      toast.error('下载失败')
      console.error(error)
    }
  }

  // 删除文件/文件夹
  const deleteFile = async (file: CloudFile) => {
    try {
      await del(`${API_URL}/cloud/files/${file.id}`)
      mutate(`${API_URL}/cloud/files?parent_id=${currentFolderId || ''}`)
      toast.success('删除成功')
    } catch (error) {
      toast.error('删除失败')
      console.error(error)
    }
  }

  // 打开编辑文件对话框
  const openEditDialog = (file: CloudFile, event: React.MouseEvent) => {
    event.stopPropagation()
    setEditingFile(file)
    setFileName(file.name)
    setFileDescription(file.description || '')
  }

  // 更新文件信息
  const updateFile = async () => {
    if (!editingFile) return

    try {
      await put(`${API_URL}/cloud/files/${editingFile.id}`, {
        name: fileName,
        description: fileDescription
      })
      
      mutate(`${API_URL}/cloud/files?parent_id=${currentFolderId || ''}`)
      toast.success('更新成功')
      setEditingFile(null)
    } catch (error) {
      toast.error('更新失败')
      console.error(error)
    }
  }

  // 预览文件
  const previewItem = async (file: CloudFile) => {
    if (file.is_folder) return

    setPreviewFile(file)
    setPreviewContent(null)
    setPreviewUrl(null)
    setPreviewType(null)

    try {
      // 对于图片，直接构造URL而不是使用API响应的URL
      if (file.type === 'image') {
        const baseUrl = '127.0.0.1:8000';
        const directUrl = `http://${baseUrl}/storage/${file.path}?t=${new Date().getTime()}`;
        setPreviewType('image');
        setPreviewUrl(directUrl);
        return;
      }
      
      const { type, content, url, message } = await apiRequest<any>(`${API_URL}/cloud/files/${file.id}/preview`)

      setPreviewType(type)
      
      if (type === 'image' || type === 'pdf') {
        setPreviewUrl(url)
      } else if (type === 'text') {
        setPreviewContent(content)
      }
    } catch (error) {
      toast.error('预览失败')
      console.error(error)
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {files.map(file => (
          <div
            key={file.id}
            className={cn(
              "flex flex-col items-center p-4 rounded-lg border cursor-pointer hover:bg-secondary/20 transition-colors",
              selectedFiles.includes(file.id) && "bg-secondary/30 border-primary"
            )}
            onClick={() => handleItemClick(file)}
          >
            <div className="relative">
              {getFileIcon(file)}
              <input
                type="checkbox"
                className="absolute -top-2 -left-2 h-4 w-4 rounded-sm border border-primary"
                checked={selectedFiles.includes(file.id)}
                onChange={(e) => {}}
                onClick={(e) => toggleSelection(file.id, e)}
              />
            </div>
            
            <div className="mt-2 text-center">
              <p className="font-medium text-sm truncate max-w-[8rem]" title={file.name}>
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
        <Dialog open={!!editingFile} onOpenChange={(open) => !open && setEditingFile(null)}>
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">描述 (可选)</Label>
                <Textarea
                  id="edit-description"
                  value={fileDescription}
                  onChange={(e) => setFileDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">取消</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button onClick={updateFile} disabled={!fileName.trim()}>保存</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 文件预览对话框 */}
      {previewFile && (
        <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{previewFile.name}</span>
                <Button variant="outline" size="sm" onClick={() => downloadFile(previewFile)}>
                  <Download className="h-4 w-4 mr-2" />
                  下载
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="min-h-[60vh] flex items-center justify-center py-4">
              {previewType === 'loading' && (
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-12 w-12 bg-muted rounded-full"></div>
                  <div className="mt-4 h-4 w-32 bg-muted rounded"></div>
                </div>
              )}

              {previewType === 'image' && previewUrl && (
                <img
                  src={previewUrl}
                  alt={previewFile.name}
                  className="max-h-[60vh] max-w-full object-contain"
                />
              )}

              {previewType === 'pdf' && previewUrl && (
                <div className="w-full h-[60vh]">
                  <iframe
                    src={previewUrl}
                    className="w-full h-full"
                    title={previewFile.name}
                  />
                </div>
              )}

              {previewType === 'text' && previewContent && (
                <pre className="w-full h-full max-h-[60vh] overflow-auto bg-muted p-4 rounded text-sm">
                  {previewContent}
                </pre>
              )}

              {previewType === 'unknown' && (
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