import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useSWRConfig } from 'swr'
import useSWRMutation from 'swr/mutation'
import { post, del, uploadFile, handleApiError } from '@/lib/api'
import useFileStore from '../store/useFileStore'
import { UPLOAD_CONFIG } from '../constants'

// 自定义 Hook: 文件夹创建
export function useCreateFolder() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [folderDescription, setFolderDescription] = useState('')
  const { mutate } = useSWRConfig()
  const { currentFolderId } = useFileStore()

  const { trigger: createFolder, isMutating } = useSWRMutation(
    '/cloud/folders',
    async (
      url,
      { arg }: { arg: { name: string; parent_id: number | null; description: string } }
    ) => {
      return await post(url, arg)
    },
    {
      onSuccess: () => {
        // 刷新文件列表
        mutate(
          key =>
            typeof key === 'string' &&
            key.startsWith(`/cloud/files?parent_id=${currentFolderId || ''}`)
        )
        toast.success('文件夹创建成功')
        resetForm()
        setIsDialogOpen(false)
      },
      onError: error => {
        handleApiError(error)
      },
    }
  )

  const resetForm = useCallback(() => {
    setFolderName('')
    setFolderDescription('')
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!folderName.trim()) {
      toast.error('请输入文件夹名称')
      return
    }

    await createFolder({
      name: folderName.trim(),
      parent_id: currentFolderId,
      description: folderDescription.trim() || '',
    })
  }, [folderName, folderDescription, currentFolderId, createFolder])

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      setIsDialogOpen(open)
      if (!open) {
        resetForm()
      }
    },
    [resetForm]
  )

  return {
    isDialogOpen,
    setIsDialogOpen: handleDialogOpenChange,
    folderName,
    setFolderName,
    folderDescription,
    setFolderDescription,
    handleSubmit,
    isLoading: isMutating,
  }
}

// 自定义 Hook: 文件上传
export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const { mutate } = useSWRConfig()
  const { currentFolderId } = useFileStore()

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (!files || files.length === 0) {
        return
      }

      const fileArray = Array.from(files)
      const { maxFileSize, allowedTypes } = UPLOAD_CONFIG

      // 验证文件
      const invalidFiles = fileArray.filter(file => {
        const isValidSize = file.size <= maxFileSize
        const isValidType = allowedTypes.some(type => file.type.startsWith(type))
        return !isValidSize || !isValidType
      })

      if (invalidFiles.length > 0) {
        const oversizedFiles = invalidFiles.filter(file => file.size > maxFileSize)
        const invalidTypeFiles = invalidFiles.filter(
          file => !allowedTypes.some(type => file.type.startsWith(type))
        )

        let errorMessage = ''
        if (oversizedFiles.length > 0) {
          errorMessage += `文件大小超过限制 (100MB): ${oversizedFiles.map(f => f.name).join(', ')}`
        }
        if (invalidTypeFiles.length > 0) {
          if (errorMessage) errorMessage += '; '
          errorMessage += `不支持的文件类型: ${invalidTypeFiles.map(f => f.name).join(', ')}`
        }

        toast.error(errorMessage)
        event.target.value = ''
        return
      }

      setIsUploading(true)
      setUploadProgress({})

      try {
        const uploadPromises = fileArray.map(async file => {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('parent_id', currentFolderId ? currentFolderId.toString() : '')

          // 初始化进度
          setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))

          try {
            await uploadFile('/cloud/files', formData)
            setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
            return { success: true, fileName: file.name }
          } catch (error) {
            setUploadProgress(prev => ({ ...prev, [file.name]: -1 }))
            return { success: false, fileName: file.name, error }
          }
        })

        const results = await Promise.allSettled(uploadPromises)
        const successful = results.filter(
          result => result.status === 'fulfilled' && result.value.success
        ).length
        const failed = results.length - successful

        // 刷新文件列表
        mutate(
          key =>
            typeof key === 'string' &&
            key.startsWith(`/cloud/files?parent_id=${currentFolderId || ''}`)
        )

        if (successful > 0) {
          toast.success(
            failed > 0
              ? `${successful} 个文件上传成功，${failed} 个失败`
              : successful > 1
                ? `${successful} 个文件上传成功`
                : '文件上传成功'
          )
        }

        if (failed > 0 && successful === 0) {
          toast.error('文件上传失败')
        }
      } catch (error) {
        handleApiError(error)
      } finally {
        setIsUploading(false)
        setUploadProgress({})
        // 清空文件输入
        event.target.value = ''
      }
    },
    [currentFolderId, mutate]
  )

  return {
    handleFileUpload,
    isUploading,
    uploadProgress,
  }
}

// 自定义 Hook: 文件删除
export function useDeleteFiles() {
  const [isDeleting, setIsDeleting] = useState(false)
  const { mutate } = useSWRConfig()
  const { currentFolderId, selectedFiles, setSelectedFiles } = useFileStore()

  const deleteSelectedFiles = useCallback(async () => {
    if (selectedFiles.length === 0) return

    setIsDeleting(true)
    try {
      // 并行删除所有选中的文件
      const deletePromises = selectedFiles.map(async id => {
        try {
          await del(`/cloud/files/${id}`)
          return { success: true, id }
        } catch (error) {
          return { success: false, id, error }
        }
      })

      const results = await Promise.allSettled(deletePromises)
      const successful = results.filter(
        result => result.status === 'fulfilled' && result.value.success
      ).length
      const failed = results.length - successful

      // 刷新文件列表
      mutate(
        key =>
          typeof key === 'string' &&
          key.startsWith(`/cloud/files?parent_id=${currentFolderId || ''}`)
      )

      if (successful > 0) {
        toast.success(
          failed > 0
            ? `已删除 ${successful} 个项目，${failed} 个失败`
            : successful > 1
              ? `已删除 ${successful} 个项目`
              : '删除成功'
        )
      }

      if (failed > 0 && successful === 0) {
        toast.error('删除失败')
      }

      setSelectedFiles([])
    } catch (error) {
      handleApiError(error)
    } finally {
      setIsDeleting(false)
    }
  }, [selectedFiles, currentFolderId, mutate, setSelectedFiles])

  const deleteFile = useCallback(
    async (fileId: number) => {
      try {
        await del(`/cloud/files/${fileId}`)
        // 刷新文件列表
        mutate(
          key =>
            typeof key === 'string' &&
            key.startsWith(`/cloud/files?parent_id=${currentFolderId || ''}`)
        )
        toast.success('删除成功')
      } catch (error) {
        handleApiError(error)
      }
    },
    [currentFolderId, mutate]
  )

  return {
    deleteSelectedFiles,
    deleteFile,
    isDeleting,
  }
}

// 自定义 Hook: 文件重命名
export function useRenameFile() {
  const [isRenaming, setIsRenaming] = useState(false)
  const { mutate } = useSWRConfig()
  const { currentFolderId } = useFileStore()

  const renameFile = useCallback(
    async (fileId: number, newName: string) => {
      if (!newName.trim()) {
        toast.error('请输入新的文件名')
        return false
      }

      setIsRenaming(true)
      try {
        await post(`/cloud/files/${fileId}/rename`, { name: newName.trim() })

        // 刷新文件列表
        mutate(
          key =>
            typeof key === 'string' &&
            key.startsWith(`/cloud/files?parent_id=${currentFolderId || ''}`)
        )
        toast.success('重命名成功')
        return true
      } catch (error) {
        handleApiError(error)
        return false
      } finally {
        setIsRenaming(false)
      }
    },
    [currentFolderId, mutate]
  )

  return {
    renameFile,
    isRenaming,
  }
}

// 自定义 Hook: 文件移动
export function useMoveFiles() {
  const [isMoving, setIsMoving] = useState(false)
  const { mutate } = useSWRConfig()
  const { currentFolderId } = useFileStore()

  const moveFiles = useCallback(
    async (fileIds: number[], targetFolderId: number | null) => {
      if (fileIds.length === 0) return false

      setIsMoving(true)
      try {
        await post('/cloud/files/move', {
          file_ids: fileIds,
          target_folder_id: targetFolderId,
        })

        // 刷新当前和目标文件夹的文件列表
        mutate(
          key =>
            typeof key === 'string' &&
            (key.startsWith(`/cloud/files?parent_id=${currentFolderId || ''}`) ||
              key.startsWith(`/cloud/files?parent_id=${targetFolderId || ''}`))
        )

        toast.success(fileIds.length > 1 ? `已移动 ${fileIds.length} 个项目` : '移动成功')
        return true
      } catch (error) {
        handleApiError(error)
        return false
      } finally {
        setIsMoving(false)
      }
    },
    [currentFolderId, mutate]
  )

  return {
    moveFiles,
    isMoving,
  }
}
