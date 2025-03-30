import { create } from 'zustand'
import { FileView, SortDirection, SortField } from '../types'

interface FileStore {
  // 状态
  currentView: FileView
  searchQuery: string
  currentFolderId: number | null
  selectedFiles: number[]
  sortField: SortField
  sortDirection: SortDirection
  
  // 动作
  setCurrentView: (view: FileView) => void
  setSearchQuery: (query: string) => void
  navigateToFolder: (folderId: number | null) => void
  setSelectedFiles: (fileIds: number[]) => void
  handleSort: (field: SortField) => void
}

const useFileStore = create<FileStore>((set) => ({
  // 初始状态
  currentView: 'grid',
  searchQuery: '',
  currentFolderId: null,
  selectedFiles: [],
  sortField: 'created_at',
  sortDirection: 'desc',
  
  // 动作
  setCurrentView: (view) => set({ currentView: view }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  navigateToFolder: (folderId) => set({ 
    currentFolderId: folderId,
    selectedFiles: [] 
  }),
  setSelectedFiles: (fileIds) => set({ selectedFiles: fileIds }),
  handleSort: (field) => set((state) => {
    if (state.sortField === field) {
      return { sortDirection: state.sortDirection === 'asc' ? 'desc' : 'asc' }
    } else {
      return {
        sortField: field,
        sortDirection: 'asc'
      }
    }
  })
}))

export default useFileStore 