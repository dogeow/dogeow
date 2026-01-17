'use client'

import { useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { useSWRConfig } from 'swr'
import useFileStore from '../../store/useFileStore'
import { apiRequest, put, del } from '@/lib/api'
import { getFileDownloadUrl } from '../../services/api'
import { FileGridItem } from './grid/components/FileGridItem'
import { EditFileDialog } from './grid/components/EditFileDialog'
import { FilePreviewDialog } from './grid/components/FilePreviewDialog'
import { useFilePreview } from './grid/hooks/useFilePreview'
import type { CloudFile } from '../../types'

interface GridViewProps {
  files: CloudFile[]
}

export default function GridView({ files }: GridViewProps) {
  const { mutate } = useSWRConfig()
  const { currentFolderId, navigateToFolder, selectedFiles, setSelectedFiles } = useFileStore()

  const [editingFile, setEditingFile] = useState<CloudFile | null>(null)
  const [fileName, setFileName] = useState('')
  const [fileDescription, setFileDescription] = useState('')

  const { previewFile, previewContent, previewUrl, previewType, previewItem, closePreview } =
    useFilePreview()

  const getSWRKey = useCallback(
    () => `/cloud/files?parent_id=${currentFolderId || ''}`,
    [currentFolderId]
  )

  const toggleSelection = useCallback(
    (fileId: number, event: React.MouseEvent) => {
      event.stopPropagation()
      setSelectedFiles(
        selectedFiles.includes(fileId)
          ? selectedFiles.filter(id => id !== fileId)
          : [...selectedFiles, fileId]
      )
    },
    [selectedFiles, setSelectedFiles]
  )

  const handleItemClick = useCallback(
    (file: CloudFile) => {
      if (file.is_folder) {
        navigateToFolder(file.id)
      } else {
        previewItem(file)
      }
    },
    [navigateToFolder, previewItem]
  )

  const downloadFile = useCallback((file: CloudFile) => {
    try {
      window.open(getFileDownloadUrl(file.id), '_blank')
      toast.success('开始下载')
    } catch {
      toast.error('下载失败')
    }
  }, [])

  const deleteFile = useCallback(
    async (file: CloudFile) => {
      try {
        await del(`/cloud/files/${file.id}`)
        mutate(key => typeof key === 'string' && key.startsWith(getSWRKey()))
        toast.success('删除成功')
      } catch {
        toast.error('删除失败')
      }
    },
    [mutate, getSWRKey]
  )

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
        description: fileDescription.trim(),
      })
      mutate(key => typeof key === 'string' && key.startsWith(getSWRKey()))
      toast.success('更新成功')
      setEditingFile(null)
    } catch {
      toast.error('更新失败')
    }
  }, [editingFile, fileName, fileDescription, mutate, getSWRKey])

  const closeEditDialog = useCallback(() => {
    setEditingFile(null)
    setFileName('')
    setFileDescription('')
  }, [])

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {files.map(file => (
          <FileGridItem
            key={file.id}
            file={file}
            isSelected={selectedFiles.includes(file.id)}
            onSelect={toggleSelection}
            onClick={handleItemClick}
            onDownload={downloadFile}
            onEdit={openEditDialog}
            onDelete={deleteFile}
          />
        ))}
      </div>

      <EditFileDialog
        file={editingFile}
        fileName={fileName}
        fileDescription={fileDescription}
        onFileNameChange={setFileName}
        onFileDescriptionChange={setFileDescription}
        onSave={updateFile}
        onClose={closeEditDialog}
      />

      <FilePreviewDialog
        file={previewFile}
        previewType={previewType}
        previewUrl={previewUrl}
        previewContent={previewContent}
        onClose={closePreview}
        onDownload={downloadFile}
      />
    </>
  )
}
