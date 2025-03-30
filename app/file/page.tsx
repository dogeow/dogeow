"use client"

import { useState } from 'react'
import FileExplorer from './components/FileExplorer'
import FileHeader from './components/FileHeader'
import FileContext from './context/FileContext'
import { FileView, SortDirection, SortField } from './types'

export default function FilePage() {
  // 状态管理
  const [currentView, setCurrentView] = useState<FileView>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<number[]>([])
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  
  // 设置排序
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // 进入文件夹
  const navigateToFolder = (folderId: number | null) => {
    setCurrentFolderId(folderId)
    setSelectedFiles([])
  }

  return (
    <FileContext.Provider 
      value={{ 
        currentView, 
        setCurrentView,
        searchQuery,
        setSearchQuery,
        currentFolderId, 
        navigateToFolder,
        selectedFiles,
        setSelectedFiles,
        sortField,
        sortDirection,
        handleSort
      }}
    >
      <div className="container mx-auto p-4">
       <FileHeader />
        
        <div className="mt-4">
          <FileExplorer />
        </div>
      </div>
    </FileContext.Provider>
  )
}