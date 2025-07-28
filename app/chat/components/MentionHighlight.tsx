'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/helpers'
import useAuthStore from '@/stores/authStore'

interface MentionHighlightProps {
  text: string
  className?: string
  onMentionClick?: (username: string) => void
}

interface MentionMatch {
  type: 'text' | 'mention'
  content: string
  username?: string
  isCurrentUser?: boolean
}

/**
 * Component that highlights @mentions in text
 * Supports both @username and @"display name" formats
 */
export function MentionHighlight({ text, className, onMentionClick }: MentionHighlightProps) {
  const { user } = useAuthStore()
  const currentUsername = user?.name?.toLowerCase()

  // Parse text to find mentions
  const parsedContent = useMemo(() => {
    if (!text) return [{ type: 'text' as const, content: '' }]

    // Regex to match @username or @"display name" patterns
    const mentionRegex = /@(?:"([^"]+)"|(\w+))/g
    const parts: MentionMatch[] = []
    let lastIndex = 0
    let match

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index),
        })
      }

      // Extract username (either quoted or unquoted)
      const username = match[1] || match[2] // match[1] is quoted, match[2] is unquoted
      const isCurrentUser = username.toLowerCase() === currentUsername

      // Add mention
      parts.push({
        type: 'mention',
        content: match[0], // Full match including @
        username,
        isCurrentUser,
      })

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex),
      })
    }

    return parts
  }, [text, currentUsername])

  const handleMentionClick = (username: string, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    onMentionClick?.(username)
  }

  return (
    <span className={className}>
      {parsedContent.map((part, index) => {
        if (part.type === 'mention') {
          return (
            <button
              key={index}
              onClick={e => handleMentionClick(part.username!, e)}
              className={cn(
                'hover:bg-primary/20 inline-flex items-center rounded px-1 py-0.5 text-sm font-medium transition-colors',
                part.isCurrentUser
                  ? 'bg-primary/15 text-primary border-primary/30 border'
                  : 'bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 dark:text-blue-400'
              )}
              title={`Mention: ${part.username}`}
            >
              {part.content}
            </button>
          )
        }

        return <span key={index}>{part.content}</span>
      })}
    </span>
  )
}

/**
 * Hook to detect mentions in text
 */
export function useMentionDetection(text: string) {
  const { user } = useAuthStore()
  const currentUsername = user?.name?.toLowerCase()

  return useMemo(() => {
    if (!text || !currentUsername) {
      return {
        hasMentions: false,
        hasCurrentUserMention: false,
        mentions: [],
      }
    }

    const mentionRegex = /@(?:"([^"]+)"|(\w+))/g
    const mentions: string[] = []
    let match
    let hasCurrentUserMention = false

    while ((match = mentionRegex.exec(text)) !== null) {
      const username = (match[1] || match[2]).toLowerCase()
      mentions.push(username)

      if (username === currentUsername) {
        hasCurrentUserMention = true
      }
    }

    return {
      hasMentions: mentions.length > 0,
      hasCurrentUserMention,
      mentions,
    }
  }, [text, currentUsername])
}

/**
 * Utility function to extract mentions from text
 */
export function extractMentions(text: string): string[] {
  if (!text) return []

  const mentionRegex = /@(?:"([^"]+)"|(\w+))/g
  const mentions: string[] = []
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    const username = match[1] || match[2]
    mentions.push(username)
  }

  return mentions
}

/**
 * Utility function to check if text contains a mention of a specific user
 */
export function containsMention(text: string, username: string): boolean {
  if (!text || !username) return false

  const mentionRegex = /@(?:"([^"]+)"|(\w+))/g
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    const mentionedUsername = (match[1] || match[2]).toLowerCase()
    if (mentionedUsername === username.toLowerCase()) {
      return true
    }
  }

  return false
}
