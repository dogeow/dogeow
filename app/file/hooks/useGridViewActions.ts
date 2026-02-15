import { useCallback, useMemo } from 'react'
import { toast } from 'react-hot-toast'
import { useSWRConfig } from 'swr'
import { del, put } from '@/lib/api'
import { getFileDownloadUrl } from '../services/api'
import useFileStore from '../store/useFileStore'
import type { CloudFile } from '../types'

interface UseGridViewActionsProps {
  currentFolderId: number | null
}

interface UseGridViewActionsReturn {
  getSWRKey: () => string
  toggleSelection: (fileId: number, event: React.MouseEvent) => void
  handleItemClick: (file: CloudFile) => void
  downloadFile: (file: CloudFile) => void
  deleteFile: (file: CloudFile) => Promise<void>
  openEditDialog: (file: CloudFile, event: React.MouseEvent) => void
}

export function useGridViewActions({
  currentFolderId,
}: UseGridViewActionsProps): UseGridViewActionsReturn {
  const { mutate } = useSWRConfig()
  const { navigateToFolder, selectedFiles, setSelectedFiles } = useFileStore()

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
      }
    },
    [navigateToFolder]
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
  }, [])

  return useMemo(
    () => ({
      getSWRKey,
      toggleSelection,
      handleItemClick,
      downloadFile,
      deleteFile,
      openEditDialog,
    }),
    [getSWRKey, toggleSelection, handleItemClick, downloadFile, deleteFile, openEditDialog]
  )
}
