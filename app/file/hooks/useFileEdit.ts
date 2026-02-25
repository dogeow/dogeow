import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useSWRConfig } from 'swr'
import { put } from '@/lib/api'
import useFileStore from '../store/useFileStore'
import { useFormModal } from '@/hooks/useFormModal'
import type { CloudFile } from '../types'

interface UseFileEditReturn {
  open: boolean
  selectedId: number | null
  mode: string
  setOpen: (open: boolean) => void
  setSelectedId: (id: number | null) => void
  openModal: (id: number, mode?: string) => void
  closeModal: () => void
  fileName: string
  fileDescription: string
  setFileName: (name: string) => void
  setFileDescription: (description: string) => void
  updateFile: () => Promise<void>
  closeEditDialog: () => void
  setEditingFile: (file: CloudFile | null) => void
}

export function useFileEdit(): UseFileEditReturn {
  const { open, selectedId, mode, setOpen, setSelectedId, openModal, closeModal } =
    useFormModal<number>('edit')

  const [fileName, setFileName] = useState('')
  const [fileDescription, setFileDescription] = useState('')
  const { mutate } = useSWRConfig()
  const { currentFolderId } = useFileStore()

  const getSWRKey = `/cloud/files?parent_id=${currentFolderId || ''}`

  const closeEditDialog = useCallback(() => {
    closeModal()
    setSelectedId(null)
    setFileName('')
    setFileDescription('')
  }, [closeModal, setSelectedId])

  const updateFile = useCallback(async () => {
    if (!selectedId || !fileName.trim()) return
    try {
      await put(`/cloud/files/${selectedId}`, {
        name: fileName.trim(),
        description: fileDescription.trim(),
      })
      mutate(key => typeof key === 'string' && key.startsWith(getSWRKey))
      toast.success('更新成功')
      closeEditDialog()
    } catch {
      toast.error('更新失败')
    }
  }, [selectedId, fileName, fileDescription, mutate, getSWRKey, closeEditDialog])

  const setEditingFile = useCallback(
    (file: CloudFile | null) => {
      if (file) {
        openModal(file.id)
        setFileName(file.name)
        setFileDescription(file.description || '')
      } else {
        closeEditDialog()
      }
    },
    [openModal, closeEditDialog]
  )

  return {
    open,
    selectedId,
    mode,
    setOpen,
    setSelectedId,
    openModal,
    closeModal,
    fileName,
    fileDescription,
    setFileName,
    setFileDescription,
    updateFile,
    closeEditDialog,
    setEditingFile,
  }
}
