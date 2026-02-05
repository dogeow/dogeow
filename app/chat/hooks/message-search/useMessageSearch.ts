import { useMemo, useState, useCallback } from 'react'
import type { ChatMessage } from '@/app/chat/types'

const PAGE_SIZE = 50

interface UseMessageSearchResult {
  searchQuery: string
  setSearchQuery: (value: string) => void
  visibleMessages: ChatMessage[]
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  handleMessageSelect: (messageId: number) => void
  hasMore: boolean
  loadMore: () => void
}

/**
 * 消息搜索逻辑提取
 */
export function useMessageSearch(
  messages: ChatMessage[],
  onMessageSelect?: (messageId: number) => void
): UseMessageSearchResult {
  const [searchQuery, setSearchQueryState] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // 包装 setSearchQuery，在搜索查询变化时重置可见数量
  const setSearchQuery = useCallback((value: string) => {
    setSearchQueryState(value)
    setVisibleCount(PAGE_SIZE)
  }, [])

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return []

    const query = searchQuery.toLowerCase()
    return messages.filter(
      message =>
        message.message.toLowerCase().includes(query) ||
        message.user.name.toLowerCase().includes(query)
    )
  }, [messages, searchQuery])

  const visibleMessages = useMemo(
    () => filteredMessages.slice(0, visibleCount),
    [filteredMessages, visibleCount]
  )

  const hasMore = filteredMessages.length > visibleCount

  const loadMore = useCallback(() => {
    setVisibleCount(prev => prev + PAGE_SIZE)
  }, [])

  const handleMessageSelect = useCallback(
    (messageId: number) => {
      onMessageSelect?.(messageId)
      setIsOpen(false)
      setSearchQuery('')
      setVisibleCount(PAGE_SIZE)
    },
    [onMessageSelect, setSearchQuery]
  )

  return {
    searchQuery,
    setSearchQuery,
    visibleMessages,
    isOpen,
    setIsOpen,
    handleMessageSelect,
    hasMore,
    loadMore,
  }
}
