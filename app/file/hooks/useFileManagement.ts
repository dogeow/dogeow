import useSWR, { KeyedMutator } from 'swr'
import { get } from '@/lib/api'
import { CloudFile, FolderNode } from '../types'

interface UseFileManagementProps {
  currentFolderId: number | null
  searchQuery: string
  sortField: string
  sortDirection: string
  currentView: string
}

interface UseFileManagementReturn {
  files: CloudFile[] | undefined
  folderTree: FolderNode[] | undefined
  isLoadingFiles: boolean
  isErrorFiles: unknown
  mutateFiles: KeyedMutator<CloudFile[]>
  isLoadingTree: boolean
  isErrorTree: unknown
  isLoading: boolean
  error: unknown
}

export const useFileManagement = ({
  currentFolderId,
  searchQuery,
  sortField,
  sortDirection,
  currentView,
}: UseFileManagementProps): UseFileManagementReturn => {
  const {
    data: files,
    error: isErrorFiles,
    isLoading: isLoadingFiles,
    mutate: mutateFiles,
  } = useSWR<CloudFile[]>(
    `/cloud/files?parent_id=${currentFolderId || ''}&search=${searchQuery}&sort_by=${sortField}&sort_direction=${sortDirection}`,
    get
  )

  const {
    data: folderTree,
    error: isErrorTree,
    isLoading: isLoadingTree,
  } = useSWR<FolderNode[]>(currentView === 'tree' ? '/cloud/tree' : null, get)

  const isLoading = isLoadingFiles || isLoadingTree
  const error = isErrorFiles || isErrorTree

  return {
    files,
    folderTree,
    isLoadingFiles,
    isErrorFiles,
    mutateFiles,
    isLoadingTree,
    isErrorTree,
    isLoading,
    error,
  }
}
