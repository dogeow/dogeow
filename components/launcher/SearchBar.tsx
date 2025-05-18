"use client"

import React, { useRef, useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  isVisible: boolean
  searchTerm: string
  setSearchTerm: (term: string) => void
  onSearch: (e: React.FormEvent, keepSearchOpen: boolean) => void
  onToggleSearch: () => void
  currentApp?: string
}

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

  // 监听点击事件，点击搜索框外部时关闭
  useEffect(() => {
    if (!isVisible) return

    const handleClickOutside = (event: MouseEvent) => {
      // 检查是否点击了清除按钮
      const target = event.target as HTMLElement
      const isClearButton = target.closest('div[class*="right-2 top-1/2"]') || 
                            target.closest('div.rounded-full > svg.h-3')
      
      if (isClearButton) {
        // 如果点击的是清除按钮，不要关闭搜索框
        return
      }
      
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        onToggleSearch()
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isVisible, onToggleSearch])

  // 清理防抖定时器
  useEffect(() => {
    return () => {
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current)
        searchDebounceTimerRef.current = null
      }
    }
  }, [])

  // 处理搜索输入变化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchTerm(newValue)
    
    // 添加调试日志
    console.log('搜索输入:', newValue, '长度:', newValue.length)
    
    // 在物品页面启用即时搜索
    if (currentApp === 'thing') {
      // 使用防抖处理搜索，避免频繁触发
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current)
      }
      searchDebounceTimerRef.current = setTimeout(() => {
        // 添加调试日志
        console.log('触发搜索事件:', newValue, '长度:', newValue.length)
        
        // 无论是否有值都触发搜索，空搜索会显示所有物品
        const searchEvent = new CustomEvent('thing-search', { 
          detail: { searchTerm: newValue } 
        })
        document.dispatchEvent(searchEvent)
      }, 500) // 500ms延迟
    }
  }

  // 清除搜索内容
  const handleClearSearch = (e: React.MouseEvent) => {
    // 阻止所有形式的事件传播
    e.stopPropagation()
    e.preventDefault()
    e.nativeEvent.stopImmediatePropagation()
    
    // 清空输入内容
    setSearchTerm('')
    
    // 保持输入框焦点
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }, 10)
    
    // 清空后也触发搜索事件，显示所有物品
    if (currentApp === 'thing') {
      // 取消可能正在进行的防抖
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current)
        searchDebounceTimerRef.current = null
      }
      
      const searchEvent = new CustomEvent('thing-search', { 
        detail: { searchTerm: '' } 
      })
      document.dispatchEvent(searchEvent)
    }
  }

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
          
          {/* 只在有输入内容时显示清除按钮 */}
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
      
      {/* 关闭搜索框按钮 */}
      <Button 
        type="button"
        variant="ghost" 
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={(e) => {
          // 阻止事件冒泡
          e.stopPropagation()
          // 关闭搜索框
          onToggleSearch()
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
} 