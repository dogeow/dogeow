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
  
  // 处理搜索表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(value)
    // 提交后保持焦点
    inputRef.current?.focus()
  }
  
  // 清除搜索内容
  const handleClear = () => {
    onChange('')
    // 清除后保持焦点
    inputRef.current?.focus()
  }
  
  return (
    <form onSubmit={handleSubmit} className="relative flex-1">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="text"
        placeholder="搜索物品..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-16 h-10"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-8 top-1/2 transform -translate-y-1/2 h-8 w-8"
          onClick={handleClear}
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
      >
        <Search className="h-4 w-4" />
      </Button>
    </form>
  )
} 