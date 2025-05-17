"use client"

import { useRef, useState, useEffect, useCallback } from 'react'
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onSearch: (value: string) => void
  debounceTime?: number // 添加防抖时间参数，默认值在下面
}

export default function SearchInput({ 
  value, 
  onChange, 
  onSearch, 
  debounceTime = 300 // 默认300ms防抖
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // 使用防抖处理搜索
  const debouncedSearch = useCallback((searchValue: string) => {
    // 取消之前的定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    // 只有在有值时才执行搜索
    if (searchValue.trim()) {
      // 设置新的定时器
      debounceTimerRef.current = setTimeout(() => {
        console.log('执行防抖搜索:', searchValue)
        onSearch(searchValue)
      }, debounceTime)
    } else if (value && !searchValue.trim()) {
      // 如果从有值变成无值，执行一次搜索清除结果
      debounceTimerRef.current = setTimeout(() => {
        console.log('清空搜索')
        onSearch('')
      }, debounceTime)
    }
  }, [onSearch, debounceTime, value])
  
  // 处理输入变化
  const handleChange = (newValue: string) => {
    onChange(newValue)
    debouncedSearch(newValue)
  }
  
  // 处理搜索表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!value.trim()) return
    
    // 添加调试日志
    console.log('表单提交搜索:', value)
    
    // 立即执行搜索，取消防抖
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    // 记录当前元素的焦点状态
    const activeElement = document.activeElement
    
    // 执行搜索
    onSearch(value)
    
    // 使用单个RAF可以减少不必要的嵌套
    requestAnimationFrame(() => {
      // 如果搜索前输入框有焦点，确保搜索后焦点回到输入框
      if (activeElement === inputRef.current || isFocused) {
        inputRef.current?.focus()
      }
    })
  }
  
  // 清除搜索内容
  const handleClear = () => {
    onChange('')
    onSearch('') // 清除时立即执行空搜索
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }
  
  // 使用事件记录焦点状态
  const handleFocus = () => setIsFocused(true)
  const handleBlur = () => setIsFocused(false)
  
  // 组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])
  
  // 组件挂载时设置焦点
  useEffect(() => {
    inputRef.current?.focus()
  }, [])
  
  // 修改value时如果输入框有焦点，确保保持焦点
  useEffect(() => {
    if (isFocused && document.activeElement !== inputRef.current) {
      inputRef.current?.focus()
    }
  }, [value, isFocused])
  
  const hasValue = Boolean(value.trim())
  
  return (
    <form onSubmit={handleSubmit} className="relative flex-1">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="text"
        placeholder="搜索物品..."
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="pl-10 pr-16 h-10"
        autoComplete="off"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-8 top-1/2 transform -translate-y-1/2 h-8 w-8"
          onClick={handleClear}
          tabIndex={-1}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        className="absolute right-0 top-1/2 transform -translate-y-1/2 h-8 w-8"
        disabled={!hasValue}
        tabIndex={-1}
      >
        <Search className="h-4 w-4" />
      </Button>
    </form>
  )
}