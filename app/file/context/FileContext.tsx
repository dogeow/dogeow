'use client'

import { createContext } from 'react'
import { FileContextType } from '../types'

const defaultContext: FileContextType = {
  currentView: 'grid',
  setCurrentView: () => {},
  searchQuery: '',
  setSearchQuery: () => {},
  currentFolderId: null,
  navigateToFolder: () => {},
  selectedFiles: [],
  setSelectedFiles: () => {},
  sortField: 'created_at',
  sortDirection: 'desc',
  handleSort: () => {}
}

const FileContext = createContext<FileContextType>(defaultContext)

export default FileContext 