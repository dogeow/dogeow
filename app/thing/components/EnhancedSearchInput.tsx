'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X, Clock, TrendingUp, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { apiRequest } from '@/lib/api'
import { Separator } from '@/components/ui/separator'

interface EnhancedSearchInputProps {
  value: string
  onChange: (value: string) => void
  onSearch: (value: string) => void
  debounceTime?: number
  enableRemoteHistory?: boolean // 是否启用远程搜索历史
}

// 本地搜索历史管理（作为备用）
const SEARCH_HISTORY_KEY = 'thing_search_history'
const MAX_HISTORY_ITEMS = 10

const getLocalSearchHistory = (): string[] => {
  if (typeof window === 'undefined') return []
  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY)
    return history ? JSON.parse(history) : []
  } catch {
    return []
  }
}

const addToLocalSearchHistory = (term: string) => {
  if (typeof window === 'undefined' || !term.trim()) return

  const history = getLocalSearchHistory()
  const filteredHistory = history.filter(item => item !== term)
  const newHistory = [term, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS)

  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory))
  } catch {
    // 忽略存储错误
  }
}

const clearLocalSearchHistory = () => {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY)
  } catch {
    // 忽略存储错误
  }
}

interface SearchHistoryItem {
  search_term: string
  last_searched: string
  search_count: number
}

export default function EnhancedSearchInput({
  value,
  onChange,
  onSearch,
  debounceTime = 300,
  enableRemoteHistory = true,
}: EnhancedSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([])
  const [localHistory, setLocalHistory] = useState<string[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const suggestionTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 加载远程搜索历史
  const loadRemoteHistory = useCallback(async () => {
    if (!enableRemoteHistory) return

    try {
      const history = await apiRequest<SearchHistoryItem[]>('/things/search/history?limit=10')
      setSearchHistory(history)
    } catch (error) {
      console.error('加载搜索历史失败:', error)
      // 失败时使用本地历史
      setLocalHistory(getLocalSearchHistory())
    }
  }, [enableRemoteHistory])

  // 获取搜索建议
  const loadSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([])
      return
    }

    setLoadingSuggestions(true)
    try {
      const results = await apiRequest<string[]>(
        `/things/search/suggestions?q=${encodeURIComponent(query)}&limit=5`
      )
      setSuggestions(results)
    } catch (error) {
      console.error('加载搜索建议失败:', error)
      setSuggestions([])
    } finally {
      setLoadingSuggestions(false)
    }
  }, [])

  // 加载初始数据
  useEffect(() => {
    if (enableRemoteHistory) {
      loadRemoteHistory()
    } else {
      setLocalHistory(getLocalSearchHistory())
    }
  }, [enableRemoteHistory, loadRemoteHistory])

  // 防抖加载搜索建议
  useEffect(() => {
    if (suggestionTimerRef.current) {
      clearTimeout(suggestionTimerRef.current)
    }

    if (value.length >= 2) {
      suggestionTimerRef.current = setTimeout(() => {
        loadSuggestions(value)
      }, 300)
    } else {
      setSuggestions([])
    }

    return () => {
      if (suggestionTimerRef.current) {
        clearTimeout(suggestionTimerRef.current)
      }
    }
  }, [value, loadSuggestions])

  // 使用防抖处理搜索
  const debouncedSearch = useCallback(
    (searchValue: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      if (searchValue.trim()) {
        debounceTimerRef.current = setTimeout(() => {
          onSearch(searchValue)
        }, debounceTime)
      } else if (value && !searchValue.trim()) {
        debounceTimerRef.current = setTimeout(() => {
          onSearch('')
        }, debounceTime)
      }
    },
    [onSearch, debounceTime, value]
  )

  // 处理输入变化
  const handleChange = (newValue: string) => {
    onChange(newValue)
    debouncedSearch(newValue)
    setShowSuggestions(newValue.length > 0 || searchHistory.length > 0 || localHistory.length > 0)
  }

  // 处理搜索表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!value.trim()) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // 添加到本地历史
    addToLocalSearchHistory(value.trim())
    setLocalHistory(getLocalSearchHistory())

    // 远程历史会在后端自动记录
    onSearch(value)
    setShowSuggestions(false)

    // 刷新远程历史
    if (enableRemoteHistory) {
      setTimeout(() => loadRemoteHistory(), 500)
    }

    requestAnimationFrame(() => {
      if (isFocused) {
        inputRef.current?.focus()
      }
    })
  }

  // 选择建议项
  const handleSuggestionSelect = (suggestion: string) => {
    onChange(suggestion)
    onSearch(suggestion)
    addToLocalSearchHistory(suggestion)
    setLocalHistory(getLocalSearchHistory())
    setShowSuggestions(false)
    inputRef.current?.focus()

    // 刷新远程历史
    if (enableRemoteHistory) {
      setTimeout(() => loadRemoteHistory(), 500)
    }
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
  const handleClearHistory = async () => {
    if (enableRemoteHistory) {
      try {
        await apiRequest('/things/search/history', 'DELETE')
        setSearchHistory([])
      } catch (error) {
        console.error('清除远程搜索历史失败:', error)
      }
    }

    clearLocalSearchHistory()
    setLocalHistory([])
  }

  const handleFocus = () => {
    setIsFocused(true)
    if (value.length > 0 || searchHistory.length > 0 || localHistory.length > 0) {
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
      if (suggestionTimerRef.current) {
        clearTimeout(suggestionTimerRef.current)
      }
    }
  }, [])

  // 过滤建议项
  const filteredSuggestions = suggestions
    .filter(s => s.toLowerCase().includes(value.toLowerCase()) && s !== value)
    .slice(0, 5)

  // 处理历史记录显示
  const displayHistory = enableRemoteHistory
    ? searchHistory
    : localHistory.map(h => ({ search_term: h, last_searched: '', search_count: 0 }))
  const filteredHistory = displayHistory
    .filter(
      h => h.search_term.toLowerCase().includes(value.toLowerCase()) && h.search_term !== value
    )
    .slice(0, 5)

  const hasValue = Boolean(value.trim())
  const hasSuggestions = filteredSuggestions.length > 0 || filteredHistory.length > 0

  return (
    <div className="relative flex-1">
      <Popover open={showSuggestions && hasSuggestions} onOpenChange={setShowSuggestions}>
        <PopoverTrigger asChild>
          <form onSubmit={handleSubmit} className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="搜索物品（支持名称、描述、标签、分类、位置）..."
              value={value}
              onChange={e => handleChange(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className="focus:ring-primary/20 h-10 pr-16 pl-10 transition-all duration-200 focus:ring-2"
              autoComplete="off"
            />
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="hover:bg-muted/80 absolute top-1/2 right-8 h-8 w-8 -translate-y-1/2 transform"
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
              className="hover:bg-primary/10 absolute top-1/2 right-0 h-8 w-8 -translate-y-1/2 transform disabled:opacity-50"
              disabled={!hasValue}
              tabIndex={-1}
            >
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </PopoverTrigger>

        <PopoverContent
          className="max-h-96 w-[var(--radix-popover-trigger-width)] overflow-y-auto p-2"
          align="start"
          sideOffset={4}
        >
          <div className="space-y-2">
            {/* 加载状态 */}
            {loadingSuggestions && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                <span className="text-muted-foreground ml-2 text-sm">加载建议...</span>
              </div>
            )}

            {/* 实时建议 */}
            {!loadingSuggestions && filteredSuggestions.length > 0 && (
              <div>
                <div className="text-muted-foreground flex items-center gap-2 px-2 py-1 text-xs font-medium">
                  <TrendingUp className="h-3 w-3" />
                  搜索建议
                </div>
                <div className="space-y-1">
                  {filteredSuggestions.map((suggestion, index) => (
                    <button
                      key={`suggestion-${index}`}
                      className="hover:bg-accent w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors"
                      onClick={() => handleSuggestionSelect(suggestion)}
                    >
                      <span className="text-foreground font-medium">{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 分隔线 */}
            {filteredSuggestions.length > 0 && filteredHistory.length > 0 && (
              <Separator className="my-2" />
            )}

            {/* 搜索历史 */}
            {filteredHistory.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-2 py-1">
                  <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
                    <Clock className="h-3 w-3" />
                    {enableRemoteHistory ? '搜索历史' : '本地搜索历史'}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive h-6 px-2 text-xs"
                    onClick={handleClearHistory}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    清除
                  </Button>
                </div>
                <div className="space-y-1">
                  {filteredHistory.map((historyItem, index) => (
                    <button
                      key={`history-${index}`}
                      className="hover:bg-accent flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors"
                      onClick={() => handleSuggestionSelect(historyItem.search_term)}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="text-muted-foreground h-3 w-3 flex-shrink-0" />
                        <span className="text-muted-foreground">{historyItem.search_term}</span>
                      </div>
                      {enableRemoteHistory && historyItem.search_count > 1 && (
                        <span className="text-muted-foreground text-xs">
                          {historyItem.search_count}次
                        </span>
                      )}
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
