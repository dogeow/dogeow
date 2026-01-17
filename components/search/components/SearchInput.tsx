'use client'

import React, { memo, forwardRef } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SearchInputProps {
  searchTerm: string
  onSearchTermChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  keyboardOpen: boolean
  placeholder?: string
}

export const SearchInput = memo(
  forwardRef<HTMLInputElement, SearchInputProps>(
    ({ searchTerm, onSearchTermChange, onSubmit, keyboardOpen, placeholder = '搜索...' }, ref) => {
      return (
        <div className="mb-4 flex-shrink-0">
          <form onSubmit={onSubmit} className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              ref={ref}
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={e => onSearchTermChange(e.target.value)}
              className={`h-10 pl-10 ${searchTerm ? 'pr-10' : 'pr-3'}`}
              autoFocus={!keyboardOpen} // 移动端键盘打开时不自动focus
            />
            {searchTerm && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2 transform"
                onClick={() => onSearchTermChange('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </form>
        </div>
      )
    }
  )
)

SearchInput.displayName = 'SearchInput'
