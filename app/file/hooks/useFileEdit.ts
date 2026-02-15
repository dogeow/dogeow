import { useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { useSWRConfig } from 'swr'
import { put } from '@/lib/api'
import useFileStore from '../store/useFileStore'
import type { CloudFile } from '../types'

interface UseFileEditReturn {
  editingFile: CloudFile | null
  fileName: string
  fileDescription: string
  setEditingFile: (file: CloudFile | null) => void
  setFileName: (name: string) => void
  setFileDescription: (description: string) => void
  updateFile: () => Promise<void>
  closeEditDialog: () => void
}

export function useFileEdit(): UseFileEditReturn {
  const [editingFile, setEditingFile] = useState<CloudFile | null>(null)
  const [fileName, setFileName] = useState('')
  const [fileDescription, setFileDescription] = useState('')
  const { mutate } = useSWRConfig()
  const { currentFolderId } = useFileStore()

  const getSWRKey = `/cloud/files?parent_id=${currentFolderId || ''}`

  const updateFile = useCallback(async () => {
    if (!editingFile || !fileName.trim()) return
    try {
      await put(`/cloud/files/${editingFile.id}`, {
        name: fileName.trim(),
        description: fileDescription.trim(),
      })
      mutate(key => typeof key === 'string' && key.startsWith(getSWRKey))
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

  return {
    editingFile,
    fileName,
    fileDescription,
    setEditingFile,
    setFileName,
    setFileDescription,
    updateFile,
    closeEditDialog,
  }
}
