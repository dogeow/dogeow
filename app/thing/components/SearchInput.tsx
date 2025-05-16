"use client"

import { useRef, useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onSearch: (value: string) => void
}

export default function SearchInput({ value, onChange, onSearch }: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  
  // 处理搜索表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // 记录当前元素的焦点状态
    const activeElement = document.activeElement
    
    // 执行搜索
    onSearch(value)
    
    // 使用RAF确保在下一个渲染周期恢复焦点
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // 如果搜索前输入框有焦点，确保搜索后焦点回到输入框
        if (activeElement === inputRef.current || isFocused) {
          inputRef.current?.focus()
        }
      })
    })
  }
  
  // 清除搜索内容
  const handleClear = () => {
    onChange('')
    // 使用RAF确保在状态更新后恢复焦点
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }
  
  // 使用事件记录焦点状态
  const handleFocus = () => setIsFocused(true)
  const handleBlur = () => setIsFocused(false)
  
  // 组件挂载时设置焦点
  useEffect(() => {
    // 只在组件挂载时设置一次焦点，避免干扰用户交互
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])
  
  // 修改value时如果输入框有焦点，确保保持焦点
  useEffect(() => {
    if (isFocused && document.activeElement !== inputRef.current) {
      inputRef.current?.focus()
    }
  }, [value, isFocused])
  
  return (
    <form onSubmit={handleSubmit} className="relative flex-1">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="text"
        placeholder="搜索物品..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="pl-10 pr-16 h-10"
        autoComplete="off" // 禁用自动完成防止干扰
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-8 top-1/2 transform -translate-y-1/2 h-8 w-8"
          onClick={handleClear}
          tabIndex={-1} // 避免Tab键干扰搜索框焦点
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        className="absolute right-0 top-1/2 transform -translate-y-1/2 h-8 w-8"
        disabled={!value.trim()}
        tabIndex={-1} // 避免Tab键干扰搜索框焦点
      >
        <Search className="h-4 w-4" />
      </Button>
    </form>
  )
} 