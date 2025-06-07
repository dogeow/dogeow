"use client"

import React, { useRef, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { SearchBarProps } from './types'

export function SearchBar({
  isVisible,
  searchTerm,
  setSearchTerm,
  onSearch,
  onToggleSearch,
  currentApp
}: SearchBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchDebounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pathname = usePathname()

  // 触发搜索事件
  const triggerSearch = useCallback((term: string) => {
    const eventName = `${currentApp}-search`
    const searchEvent = new CustomEvent(eventName, { 
      detail: { searchTerm: term } 
    })
    document.dispatchEvent(searchEvent)
  }, [currentApp])

  // 清理防抖定时器
  const clearDebounceTimer = useCallback(() => {
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current)
      searchDebounceTimerRef.current = null
    }
  }, [])

  // 监听路由变化，变化后，清除搜索内容
  useEffect(() => {
      setSearchTerm('')
  }, [pathname, setSearchTerm])

  // 监听点击事件，点击搜索框外部时关闭
  useEffect(() => {
    if (!isVisible) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const isClearButton = target.closest('div[class*="right-2 top-1/2"]') || 
                           target.closest('div.rounded-full > svg.h-3')
      
      if (isClearButton) return
      
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        onToggleSearch()
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isVisible, onToggleSearch])

  // 组件卸载时清理定时器
  useEffect(() => clearDebounceTimer, [clearDebounceTimer])

  // 处理搜索输入变化
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchTerm(newValue)
    
    if (currentApp === 'thing' || currentApp === 'nav') {
      clearDebounceTimer()
      searchDebounceTimerRef.current = setTimeout(() => {
        triggerSearch(newValue)
      }, 500)
    }
  }, [currentApp, setSearchTerm, clearDebounceTimer, triggerSearch])

  // 清除搜索内容
  const handleClearSearch = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    e.nativeEvent.stopImmediatePropagation()
    
    setSearchTerm('')
    
    if (searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 10)
    }
    
    clearDebounceTimer()
    triggerSearch('')
  }, [setSearchTerm, clearDebounceTimer, triggerSearch])

  if (!isVisible) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={onToggleSearch}
      >
        <Search className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-1 max-w-md mx-auto">
      <div className="relative flex-1">
        <form 
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onSearch(e, true)
          }} 
          className="flex items-center w-full"
        >
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder={`搜索${currentApp ? currentApp + '...' : '...'}`}
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full h-9 pl-8 pr-8 border-primary/20 animate-in fade-in duration-150"
          />
          
          {searchTerm && (
            <div 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700 border border-transparent hover:border-gray-300 dark:hover:border-gray-600"
              data-clear-button="true"
              title="清除搜索内容"
              onClick={handleClearSearch}
            >
              <X className="h-3 w-3 text-gray-500" />
            </div>
          )}
        </form>
      </div>
      
      <Button 
        type="button"
        variant="ghost" 
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={(e) => {
          e.stopPropagation()
          onToggleSearch()
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}