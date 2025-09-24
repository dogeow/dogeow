'use client'

import { useRef } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import type { MentionSuggestionsProps } from './types'

export function MentionSuggestions({
  suggestions,
  selectedIndex,
  onSelect,
}: MentionSuggestionsProps) {
  const { t } = useTranslation()
  const listRef = useRef<HTMLDivElement>(null)

  if (suggestions.length === 0) return null

  return (
    <div
      ref={listRef}
      className="bg-background absolute bottom-full left-0 z-50 mb-1 w-full max-w-xs rounded-md border shadow-lg"
      role="listbox"
      aria-label={t('chat.mention_suggestions', 'Mention suggestions')}
    >
      {suggestions.map((user, index) => (
        <button
          key={user.id}
          onClick={() => onSelect(user)}
          className={`hover:bg-muted focus:ring-primary flex w-full items-center gap-2 px-3 py-2 text-left focus:ring-2 focus:outline-none ${
            index === selectedIndex ? 'bg-muted' : ''
          }`}
          role="option"
          aria-selected={index === selectedIndex}
          aria-label={`${t('chat.mention_user', 'Mention')} ${user.name}`}
        >
          <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-medium">{user.name}</div>
            <div className="text-muted-foreground text-xs">{user.email}</div>
          </div>
        </button>
      ))}
    </div>
  )
}
