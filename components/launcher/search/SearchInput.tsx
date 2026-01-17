import React, { memo, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'

interface SearchInputProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  onClear: () => void
  onSubmit: (e: React.FormEvent) => void
  currentApp?: string
  inputRef?: React.RefObject<HTMLInputElement>
}

export const SearchInput = memo<SearchInputProps>(
  ({ searchTerm, onSearchChange, onClear, onSubmit, currentApp, inputRef }) => {
    const { t } = useTranslation()

    return (
      <form onSubmit={onSubmit} className="flex w-full items-center">
        <Search className="text-primary absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 transform" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={`${t('search.in')}${currentApp ? currentApp + '...' : '...'}`}
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          className="border-primary/20 animate-in fade-in h-9 w-full pr-8 pl-8 duration-150"
        />

        {searchTerm && (
          <div
            className="absolute top-1/2 right-2 -translate-y-1/2 transform cursor-pointer rounded-full border border-transparent p-1 hover:border-gray-300 hover:bg-gray-200 dark:hover:border-gray-600 dark:hover:bg-gray-700"
            data-clear-button="true"
            title="清除搜索内容"
            onClick={onClear}
          >
            <X className="h-3 w-3 text-gray-500" />
          </div>
        )}
      </form>
    )
  }
)

SearchInput.displayName = 'SearchInput'
