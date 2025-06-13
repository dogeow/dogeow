"use client"

import { useRef, useState, useEffect, useCallback } from 'react'
import { Input } from "@/components/ui/input"
import { Search, X, Clock, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"


interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onSearch: (value: string) => void
  debounceTime?: number
  suggestions?: string[]
}

// 搜索历史管理
const SEARCH_HISTORY_KEY = 'thing_search_history'
const MAX_HISTORY_ITEMS = 10

const getSearchHistory = (): string[] => {
  if (typeof window === 'undefined') return []
  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY)
    return history ? JSON.parse(history) : []
  } catch {
    return []
  }
}

const addToSearchHistory = (term: string) => {
  if (typeof window === 'undefined' || !term.trim()) return
  
  const history = getSearchHistory()
  const filteredHistory = history.filter(item => item !== term)
  const newHistory = [term, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS)
  
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory))
  } catch {
    // 忽略存储错误
  }
}

const clearSearchHistory = () => {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY)
  } catch {
    // 忽略存储错误
  }
}

export default function SearchInput({ 
  value, 
  onChange, 
  onSearch, 
  debounceTime = 300,
  suggestions = []
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // 加载搜索历史
  useEffect(() => {
    setSearchHistory(getSearchHistory())
  }, [])
  
  // 使用防抖处理搜索
  const debouncedSearch = useCallback((searchValue: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    if (searchValue.trim()) {
      debounceTimerRef.current = setTimeout(() => {
        console.log('执行防抖搜索:', searchValue)
        onSearch(searchValue)
      }, debounceTime)
    } else if (value && !searchValue.trim()) {
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
    setShowSuggestions(newValue.length > 0)
  }
  
  // 处理搜索表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!value.trim()) return
    
    console.log('表单提交搜索:', value)
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    // 添加到搜索历史
    addToSearchHistory(value.trim())
    setSearchHistory(getSearchHistory())
    
    const activeElement = document.activeElement
    onSearch(value)
    setShowSuggestions(false)
    
    requestAnimationFrame(() => {
      if (activeElement === inputRef.current || isFocused) {
        inputRef.current?.focus()
      }
    })
  }
  
  // 选择建议项
  const handleSuggestionSelect = (suggestion: string) => {
    onChange(suggestion)
    onSearch(suggestion)
    addToSearchHistory(suggestion)
    setSearchHistory(getSearchHistory())
    setShowSuggestions(false)
    inputRef.current?.focus()
  }
  
  // 清除搜索内容
  const handleClear = () => {
    onChange('')
    onSearch('')
    setShowSuggestions(false)
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }
  
  // 清除搜索历史
  const handleClearHistory = () => {
    clearSearchHistory()
    setSearchHistory([])
  }
  
  const handleFocus = () => {
    setIsFocused(true)
    if (value.length > 0 || searchHistory.length > 0) {
      setShowSuggestions(true)
    }
  }
  
  const handleBlur = () => {
    setIsFocused(false)
    // 延迟关闭建议，允许点击建议项
    setTimeout(() => setShowSuggestions(false), 200)
  }
  
  // 组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])
  
  // 过滤建议项
  const filteredSuggestions = suggestions.filter(s => 
    s.toLowerCase().includes(value.toLowerCase()) && s !== value
  ).slice(0, 5)
  
  // 过滤搜索历史
  const filteredHistory = searchHistory.filter(h => 
    h.toLowerCase().includes(value.toLowerCase()) && h !== value
  ).slice(0, 5)
  
  const hasValue = Boolean(value.trim())
  const hasSuggestions = filteredSuggestions.length > 0 || filteredHistory.length > 0
  
  return (
    <div className="relative flex-1">
      <Popover open={showSuggestions && hasSuggestions} onOpenChange={setShowSuggestions}>
        <PopoverTrigger asChild>
          <form onSubmit={handleSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="搜索物品..."
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className="pl-10 pr-16 h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              autoComplete="off"
            />
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-8 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-muted/80"
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
              className="absolute right-0 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-primary/10 disabled:opacity-50"
              disabled={!hasValue}
              tabIndex={-1}
            >
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-[var(--radix-popover-trigger-width)] p-2 max-h-80 overflow-y-auto" 
          align="start"
          sideOffset={4}
        >
          <div className="space-y-2">
            {/* 实时建议 */}
            {filteredSuggestions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  建议
                </div>
                <div className="space-y-1">
                  {filteredSuggestions.map((suggestion, index) => (
                    <button
                      key={`suggestion-${index}`}
                      className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded-md transition-colors"
                      onClick={() => handleSuggestionSelect(suggestion)}
                    >
                      <span className="text-foreground">{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* 搜索历史 */}
            {filteredHistory.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-2 py-1">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    最近搜索
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={handleClearHistory}
                  >
                    清除
                  </Button>
                </div>
                <div className="space-y-1">
                  {filteredHistory.map((historyItem, index) => (
                    <button
                      key={`history-${index}`}
                      className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded-md transition-colors flex items-center gap-2"
                      onClick={() => handleSuggestionSelect(historyItem)}
                    >
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{historyItem}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}