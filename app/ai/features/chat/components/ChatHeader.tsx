import React from 'react'
import { Bot, Trash2, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'

interface ChatHeaderProps {
  title?: string
  subtitle?: string
  hasMessages: boolean
  isLoading: boolean
  onClear: () => void
  /** dialog: 在 Radix Dialog 内，用 DialogTitle；panel: 非弹窗面板，用原生元素 */
  variant?: 'dialog' | 'page' | 'panel'
  hideClear?: boolean
  /** 弹窗下用 Tabs 切换模式时传入 */
  chatMode?: 'ai' | 'knowledge'
  onChatModeChange?: (value: 'ai' | 'knowledge') => void
}

function DialogLikeHeader({
  title,
  subtitle,
  hasMessages,
  isLoading,
  onClear,
  hideClear,
  chatMode,
  onChatModeChange,
  useNativeTitle,
}: ChatHeaderProps & { useNativeTitle: boolean }) {
  const useTabs = chatMode !== undefined && onChatModeChange != null
  const TitleTag = useNativeTitle ? 'span' : DialogTitle

  return (
    <div className="relative !flex h-14 flex-none !flex-row items-center justify-between border-b px-4 py-0">
      <div className="m-0 flex min-w-0 flex-1 items-center gap-3">
        {useTabs ? (
          <TitleTag className="sr-only">
            {chatMode === 'knowledge' ? '知识库问答' : 'AI 助理'}
          </TitleTag>
        ) : (
          <>
            <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
              <Bot className="h-4 w-4" />
            </div>
            <TitleTag className="truncate text-base leading-none">{title}</TitleTag>
            {subtitle && <span className="text-muted-foreground shrink-0 text-xs">{subtitle}</span>}
          </>
        )}
      </div>
      {useTabs && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Tabs
            value={chatMode}
            onValueChange={v => onChatModeChange!(v as 'ai' | 'knowledge')}
            className="w-auto"
          >
            <TabsList className="bg-muted/50 h-11">
              <TabsTrigger value="ai" className="gap-2 px-5 text-base">
                <Bot className="h-5 w-5" />
                通用 AI
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="gap-2 px-5 text-base">
                <BookOpen className="h-5 w-5" />
                知识库 AI
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}
      <div className="flex shrink-0 items-center gap-1 pr-10">
        {hasMessages && !hideClear && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            disabled={isLoading}
            className="text-muted-foreground h-8 w-8"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

export const ChatHeader = React.memo<ChatHeaderProps>(
  ({
    title = 'AI 助理',
    subtitle,
    hasMessages,
    isLoading,
    onClear,
    variant = 'page',
    hideClear = false,
    chatMode,
    onChatModeChange,
  }) => {
    if (variant === 'dialog') {
      return (
        <DialogLikeHeader
          title={title}
          subtitle={subtitle}
          hasMessages={hasMessages}
          isLoading={isLoading}
          onClear={onClear}
          hideClear={hideClear}
          chatMode={chatMode}
          onChatModeChange={onChatModeChange}
          useNativeTitle={false}
        />
      )
    }
    if (variant === 'panel') {
      return (
        <DialogLikeHeader
          title={title}
          subtitle={subtitle}
          hasMessages={hasMessages}
          isLoading={isLoading}
          onClear={onClear}
          hideClear={hideClear}
          chatMode={chatMode}
          onChatModeChange={onChatModeChange}
          useNativeTitle={true}
        />
      )
    }

    // page variant
    return (
      <div className="bg-background border-b px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <div className="bg-muted text-muted-foreground flex h-10 w-10 items-center justify-center rounded-full">
            <Bot className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{title}</h1>
            {subtitle && <p className="text-muted-foreground text-xs">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/ai/knowledge" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">知识库问答</span>
              </Link>
            </Button>
            {hasMessages && !hideClear && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                disabled={isLoading}
                className="text-muted-foreground"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }
)

ChatHeader.displayName = 'ChatHeader'
