'use client'

import { useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Grid, 
  List, 
  Search, 
  FolderPlus, 
  Upload,
  SlidersHorizontal, 
  Trash2,
  FolderTree
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from 'react-hot-toast'
import FileContext from '../context/FileContext'
import { useSWRConfig } from 'swr'

// 后端API基础URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// 获取授权头
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? 
    localStorage.getItem('token') || sessionStorage.getItem('token') : null;
  
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function FileHeader() {
  const { 
    currentView, 
    setCurrentView, 
    searchQuery, 
    setSearchQuery,
    currentFolderId,
    selectedFiles,
    setSelectedFiles
  } = useContext(FileContext)
  
  const [folderName, setFolderName] = useState('')
  const [folderDescription, setFolderDescription] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const { mutate } = useSWRConfig()

  const createFolder = async () => {
    try {
      await axios.post(`${API_BASE_URL}/cloud/folders`, {
        name: folderName,
        parent_id: currentFolderId,
        description: folderDescription
      }, {
        headers: getAuthHeaders()
      })
      
      mutate(`${API_BASE_URL}/cloud/files?parent_id=${currentFolderId || ''}`)
      toast.success('文件夹创建成功')
      setFolderName('')
      setFolderDescription('')
    } catch (error) {
      toast.error('创建文件夹失败')
      console.error(error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return
    }

    const files = Array.from(event.target.files)
    setIsUploading(true)

    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('parent_id', currentFolderId ? currentFolderId.toString() : '')

        await axios.post(`${API_BASE_URL}/cloud/files`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...getAuthHeaders()
          }
        })
      }
      
      mutate(`${API_BASE_URL}/cloud/files?parent_id=${currentFolderId || ''}`)
      toast.success(files.length > 1 ? `${files.length} 个文件上传成功` : '文件上传成功')
    } catch (error) {
      toast.error('文件上传失败')
      console.error(error)
    } finally {
      setIsUploading(false)
      // 清除文件选择器
      event.target.value = ''
    }
  }

  const deleteSelectedFiles = async () => {
    if (selectedFiles.length === 0) return
    
    try {
      for (const id of selectedFiles) {
        await axios.delete(`${API_BASE_URL}/cloud/files/${id}`, {
          headers: getAuthHeaders()
        })
      }
      
      mutate(`${API_BASE_URL}/cloud/files?parent_id=${currentFolderId || ''}`)
      toast.success(selectedFiles.length > 1 
        ? `已删除 ${selectedFiles.length} 个项目` 
        : '删除成功'
      )
      setSelectedFiles([])
    } catch (error) {
      toast.error('删除失败')
      console.error(error)
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="搜索文件..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex items-center space-x-2">
        {/* 视图切换按钮 */}
        <div className="flex border rounded-md">
          <Button
            variant={currentView === 'grid' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8 rounded-none rounded-l-md"
            onClick={() => setCurrentView('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={currentView === 'list' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8 rounded-none"
            onClick={() => setCurrentView('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={currentView === 'tree' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8 rounded-none rounded-r-md"
            onClick={() => setCurrentView('tree')}
          >
            <FolderTree className="h-4 w-4" />
          </Button>
        </div>

        {/* 新建文件夹按钮 */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <FolderPlus className="h-4 w-4 mr-2" />
              新建文件夹
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新建文件夹</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">文件夹名称</Label>
                <Input 
                  id="name" 
                  value={folderName} 
                  onChange={(e) => setFolderName(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">描述 (可选)</Label>
                <Textarea 
                  id="description" 
                  value={folderDescription} 
                  onChange={(e) => setFolderDescription(e.target.value)} 
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">取消</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button onClick={createFolder} disabled={!folderName.trim()}>创建</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 上传文件按钮 */}
        <Button variant="outline" size="sm" className="h-8 relative" disabled={isUploading}>
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileUpload}
            multiple
          />
          <Upload className="h-4 w-4 mr-2" />
          上传文件
          {isUploading && (
            <span className="ml-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
          )}
        </Button>

        {/* 删除按钮，只有在选中文件时显示 */}
        {selectedFiles.length > 0 && (
          <Button 
            variant="destructive" 
            size="sm" 
            className="h-8"
            onClick={deleteSelectedFiles}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            删除
          </Button>
        )}
      </div>
    </div>
  )
} 