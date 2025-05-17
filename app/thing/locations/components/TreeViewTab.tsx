"use client"

import { useState, useEffect } from 'react'
import LocationTreeSelect from '../../components/LocationTreeSelect'
import { LocationType } from '../hooks/useLocationManagement'
import FolderIcon from '../../components/FolderIcon'

interface TreeViewTabProps {
  selectedLocation?: { type: LocationType, id: number };
  onLocationSelect: (type: LocationType, id: number, fullPath: string) => void;
}

export default function TreeViewTab({ selectedLocation, onLocationSelect }: TreeViewTabProps) {
  const [isTreeExpanded, setIsTreeExpanded] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  // 检测是否是暗色模式
  useEffect(() => {
    const checkDarkMode = () => {
      if (typeof window !== 'undefined') {
        setIsDarkMode(document.documentElement.classList.contains('dark'))
      }
    }
    
    checkDarkMode()
    
    // 创建一个MutationObserver来监听类名变化
    if (typeof window !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            checkDarkMode()
          }
        })
      })
      
      observer.observe(document.documentElement, { attributes: true })
      
      return () => {
        observer.disconnect()
      }
    }
  }, [])
  
  // 处理树形展开/折叠
  const toggleTreeExpanded = () => {
    setIsTreeExpanded(!isTreeExpanded)
  }
  
  return (
    <div className="flex flex-col">
      <div className="w-full border rounded-lg shadow-sm overflow-hidden">
        <div className="p-3 border-b bg-gray-50 dark:bg-gray-800" 
          style={{ backgroundColor: isDarkMode ? 'rgb(31 41 55)' : 'rgb(249 250 251)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">位置树形结构</h2>
            <button 
              className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              onClick={toggleTreeExpanded}
              title={isTreeExpanded ? "折叠所有" : "展开所有"}
            >
              <FolderIcon isOpen={isTreeExpanded} size={18} />
            </button>
          </div>
        </div>
        <div className="p-0">
          <LocationTreeSelect 
            onSelect={onLocationSelect}
            selectedLocation={selectedLocation}
            className="border-none shadow-none rounded-none"
            isExpanded={isTreeExpanded}
          />
        </div>
      </div>
    </div>
  )
} 