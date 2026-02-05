import { useState, useMemo, useCallback } from 'react'
import { MAX_MENTION_SUGGESTIONS } from '@/app/chat/utils/message-input/constants'
import type { MentionSuggestion } from '@/app/chat/types/messageInput'

interface OnlineUser {
  id: number
  name: string
  email: string
}

export function useMentions(roomUsers: OnlineUser[]) {
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionPosition, setMentionPosition] = useState(0)
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0)

  // 过滤用户用于@提及建议
  const mentionSuggestions: MentionSuggestion[] = useMemo(() => {
    if (!mentionQuery.trim()) return []

    const query = mentionQuery.toLowerCase()
    return roomUsers
      .filter(
        user => user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
      )
      .slice(0, MAX_MENTION_SUGGESTIONS)
  }, [roomUsers, mentionQuery])

  // 检查@提及
  const checkForMentions = useCallback((text: string, cursorPos: number) => {
    const beforeCursor = text.slice(0, cursorPos)
    const mentionMatch = beforeCursor.match(/@(\w*)$/)

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1])
      setMentionPosition(mentionMatch.index || 0)
      setShowMentions(true)
      setSelectedMentionIndex(0)
    } else {
      setShowMentions(false)
      setMentionQuery('')
    }
  }, [])

  // 插入提及
  const insertMention = useCallback(
    (user: MentionSuggestion, message: string, setMessage: (msg: string) => void) => {
      const beforeMention = message.slice(0, mentionPosition)
      const afterMention = message.slice(mentionPosition + mentionQuery.length + 1) // +1 表示@符号
      const newMessage = `${beforeMention}@${user.name} ${afterMention}`

      setMessage(newMessage)
      setShowMentions(false)
      setMentionQuery('')

      return {
        newMessage,
        newCursorPos: beforeMention.length + user.name.length + 2, // +2 表示@和空格
      }
    },
    [mentionPosition, mentionQuery]
  )

  // 处理提及导航
  const handleMentionNavigation = useCallback(
    (key: string) => {
      if (!showMentions || mentionSuggestions.length === 0) return false

      switch (key) {
        case 'ArrowDown':
          setSelectedMentionIndex(prev => (prev < mentionSuggestions.length - 1 ? prev + 1 : 0))
          return true
        case 'ArrowUp':
          setSelectedMentionIndex(prev => (prev > 0 ? prev - 1 : mentionSuggestions.length - 1))
          return true
        case 'Escape':
          setShowMentions(false)
          return true
        default:
          return false
      }
    },
    [showMentions, mentionSuggestions.length]
  )

  return {
    showMentions,
    mentionSuggestions,
    selectedMentionIndex,
    checkForMentions,
    insertMention,
    handleMentionNavigation,
    setShowMentions,
  }
}
