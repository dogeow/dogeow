'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, FolderPlus, Upload, Trash2, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import useFileStore from '../store/useFileStore'
import type { FileView } from '../types'
import { useCreateFolder, useFileUpload, useDeleteFiles } from '../hooks/useFileOperations'
import { useSearchDebounce } from '../hooks/useDebounce'
import { VIEW_CONFIG, SEARCH_CONFIG } from '../constants'

export default function FileHeader() {
  const { currentView, setCurrentView, searchQuery, setSearchQuery, selectedFiles } = useFileStore()

  const createFolderHook = useCreateFolder()
  const fileUploadHook = useFileUpload()
  const deleteFilesHook = useDeleteFiles()

  // 使用防抖搜索
  const { isSearching } = useSearchDebounce(
    searchQuery,
    SEARCH_CONFIG.debounceDelay,
    SEARCH_CONFIG.minQueryLength
  )

  // 渲染视图切换按钮
  const renderViewToggle = () => (
    <div className="flex overflow-hidden rounded-md border">
      {(Object.entries(VIEW_CONFIG) as [FileView, (typeof VIEW_CONFIG)[FileView]][]).map(
        ([view, config], index) => {
          const Icon = config.icon
          const isFirst = index === 0
          const isLast = index === Object.keys(VIEW_CONFIG).length - 1

          return (
            <Button
              key={view}
              variant={currentView === view ? 'default' : 'ghost'}
              size="icon"
              className={`h-8 w-8 rounded-none ${isFirst ? 'rounded-l-md' : ''} ${isLast ? 'rounded-r-md' : ''}`}
              onClick={() => setCurrentView(view)}
              title={config.label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          )
        }
      )}
    </div>
  )

  // 渲染新建文件夹对话框
  const renderCreateFolderDialog = () => (
    <Dialog open={createFolderHook.isDialogOpen} onOpenChange={createFolderHook.setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8" title="新建文件夹">
          <FolderPlus className="mr-2 h-4 w-4" />
          新建
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新建文件夹</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">文件夹名称 *</Label>
            <Input
              id="folder-name"
              placeholder="请输入文件夹名称"
              value={createFolderHook.folderName}
              onChange={e => createFolderHook.setFolderName(e.target.value)}
              disabled={createFolderHook.isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="folder-description">描述 (可选)</Label>
            <Textarea
              id="folder-description"
              placeholder="请输入文件夹描述"
              value={createFolderHook.folderDescription}
              onChange={e => createFolderHook.setFolderDescription(e.target.value)}
              disabled={createFolderHook.isLoading}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={createFolderHook.isLoading}>
              取消
            </Button>
          </DialogClose>
          <Button
            onClick={createFolderHook.handleSubmit}
            disabled={!createFolderHook.folderName.trim() || createFolderHook.isLoading}
          >
            {createFolderHook.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            创建
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* 搜索框 */}
      <div className="relative max-w-md flex-1">
        <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
        {isSearching && (
          <Loader2 className="text-muted-foreground absolute top-2.5 right-2.5 h-4 w-4 animate-spin" />
        )}
        <Input
          type="search"
          placeholder="搜索文件和文件夹..."
          className={`pl-8 ${isSearching ? 'pr-8' : ''}`}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 操作按钮组 */}
      <div className="flex items-center space-x-2">
        {/* 视图切换 */}
        {renderViewToggle()}

        {/* 新建文件夹 */}
        {renderCreateFolderDialog()}

        {/* 文件上传 */}
        <Button
          variant="outline"
          size="sm"
          className="relative h-8"
          disabled={fileUploadHook.isUploading}
          title="上传文件"
        >
          <input
            type="file"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            onChange={fileUploadHook.handleFileUpload}
            multiple
            disabled={fileUploadHook.isUploading}
          />
          <Upload className="mr-2 h-4 w-4" />
          上传
          {fileUploadHook.isUploading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
        </Button>

        {/* 批量删除按钮 */}
        {selectedFiles.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            className="h-8"
            onClick={deleteFilesHook.deleteSelectedFiles}
            disabled={deleteFilesHook.isDeleting}
            title={`删除选中的 ${selectedFiles.length} 个项目`}
          >
            {deleteFilesHook.isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            删除 ({selectedFiles.length})
          </Button>
        )}
      </div>
    </div>
  )
}
