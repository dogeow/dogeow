'use client'

import { X, Trash2, BookOpen, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'

type SearchMethod = 'simple' | 'rag'

interface KnowledgeChatHeaderProps {
  variant?: 'page' | 'dialog'
  title?: string
  subtitle?: string
  hasMessages: boolean
  isLoading: boolean
  useContext: boolean
  onUseContextChange: (value: boolean) => void
  searchMethod: SearchMethod
  onSearchMethodChange: (value: SearchMethod) => void
  onClear: () => void
  onClose?: () => void
  hideUseContext?: boolean
  hideAiLink?: boolean
  hideSearchMethod?: boolean
  hideTitle?: boolean
}

export function KnowledgeChatHeader({
  variant = 'page',
  title = '知识库问答',
  subtitle,
  hasMessages,
  isLoading,
  useContext,
  onUseContextChange,
  searchMethod,
  onSearchMethodChange,
  onClear,
  onClose,
  hideUseContext = false,
  hideAiLink = false,
  hideSearchMethod = false,
  hideTitle = false,
}: KnowledgeChatHeaderProps) {
  return (
    <header className="bg-background flex items-center justify-between px-4 py-3">
      {!hideTitle && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="text-primary h-5 w-5" />
            <div>
              <h1 className="text-lg font-semibold">{title}</h1>
              {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        {variant === 'page' && !hideAiLink && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/ai" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">普通问答</span>
            </Link>
          </Button>
        )}
        {useContext && !hideSearchMethod && (
          <div className="flex items-center gap-2">
            <Label htmlFor="search-method" className="text-sm">
              搜索方法:
            </Label>
            <Select value={searchMethod} onValueChange={onSearchMethodChange} disabled={isLoading}>
              <SelectTrigger id="search-method" className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rag">RAG (向量)</SelectItem>
                <SelectItem value="simple">关键词匹配</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {!hideUseContext && (
          <div className="flex items-center gap-2">
            <Switch
              id="use-context"
              checked={useContext}
              onCheckedChange={onUseContextChange}
              disabled={isLoading}
            />
            <Label htmlFor="use-context" className="cursor-pointer text-sm">
              使用知识库
            </Label>
          </div>
        )}

        {hasMessages && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={isLoading}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            清除
          </Button>
        )}

        {variant === 'dialog' && onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="gap-2">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  )
}
