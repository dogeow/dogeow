'use client'

import React, { useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { SearchBarProps } from './types'
import { SearchInput } from './search/SearchInput'

export function SearchBar({
  isVisible,
  searchTerm,
  setSearchTerm,
  onSearch,
  onToggleSearch,
  currentApp,
}: SearchBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchDebounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pathname = usePathname()

  // 触发搜索事件
  const triggerSearch = useCallback(
    (term: string) => {
      const eventName = `${currentApp}-search`
      const searchEvent = new CustomEvent(eventName, {
        detail: { searchTerm: term },
      })
      document.dispatchEvent(searchEvent)
    },
    [currentApp]
  )

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
      const isClearButton =
        target.closest('div[class*="right-2 top-1/2"]') ||
        target.closest('div.rounded-full > svg.h-3')

      if (isClearButton) return

      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        onToggleSearch()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isVisible, onToggleSearch])

  // 组件卸载时清理定时器
  useEffect(() => clearDebounceTimer, [clearDebounceTimer])

  // 处理搜索输入变化
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value)

      if (currentApp === 'thing' || currentApp === 'nav') {
        clearDebounceTimer()
        searchDebounceTimerRef.current = setTimeout(() => {
          triggerSearch(value)
        }, 500)
      }
    },
    [currentApp, setSearchTerm, clearDebounceTimer, triggerSearch]
  )

  // 清除搜索内容
  const handleClearSearch = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation()
        e.preventDefault()
        e.nativeEvent.stopImmediatePropagation()
      }

      setSearchTerm('')

      if (searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 10)
      }

      clearDebounceTimer()
      triggerSearch('')
    },
    [setSearchTerm, clearDebounceTimer, triggerSearch]
  )

  if (!isVisible) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onToggleSearch}>
        <Search className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <div className="mx-auto flex max-w-md flex-1 items-center gap-2">
      <div className="relative flex-1">
        <SearchInput
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          onClear={handleClearSearch}
          onSubmit={e => {
            e.preventDefault()
            e.stopPropagation()
            onSearch(e, true)
          }}
          currentApp={currentApp}
          inputRef={searchInputRef}
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={e => {
          e.stopPropagation()
          onToggleSearch()
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
