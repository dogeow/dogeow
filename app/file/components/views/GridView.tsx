'use client'

import { useState } from 'react'
import { useFilePreview } from './grid/hooks/useFilePreview'
import { useGridViewActions } from '@/app/file/hooks/useGridViewActions'
import { useFileEdit } from '@/app/file/hooks/useFileEdit'
import { FileGridItem } from './grid/components/FileGridItem'
import { EditFileDialog } from './grid/components/EditFileDialog'
import { FilePreviewDialog } from './grid/components/FilePreviewDialog'
import useFileStore from '@/app/file/store/useFileStore'
import type { CloudFile } from '@/app/file/types'

interface GridViewProps {
  files: CloudFile[]
}

export default function GridView({ files }: GridViewProps) {
  const { currentFolderId } = useFileStore()
  const { previewFile, previewType, previewUrl, previewContent, previewItem, closePreview } =
    useFilePreview()
  const { getSWRKey, toggleSelection, handleItemClick, downloadFile, deleteFile, openEditDialog } =
    useGridViewActions({ currentFolderId })
  const {
    editingFile,
    fileName,
    fileDescription,
    setEditingFile,
    setFileName,
    setFileDescription,
    updateFile,
    closeEditDialog,
  } = useFileEdit()

  const handleItemClickWithPreview = (file: CloudFile) => {
    if (file.is_folder) {
      handleItemClick(file)
    } else {
      previewItem(file)
    }
  }

  const handleEdit = (file: CloudFile, event: React.MouseEvent) => {
    event.stopPropagation()
    setEditingFile(file)
    setFileName(file.name)
    setFileDescription(file.description || '')
  }

  const handleDelete = (file: CloudFile, event: React.MouseEvent) => {
    event.stopPropagation()
    deleteFile(file)
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {files.map(file => (
          <FileGridItem
            key={file.id}
            file={file}
            isSelected={false}
            onSelect={toggleSelection}
            onClick={handleItemClickWithPreview}
            onDownload={downloadFile}
            onEdit={handleEdit}
            onDelete={handleDelete}
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
