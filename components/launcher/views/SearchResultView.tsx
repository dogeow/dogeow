import React from 'react'
import { Button } from '@/components/ui/button'
import { LogoButton } from '../common/LogoButton'

interface SearchResultViewProps {
  searchText: string
  onReset: () => void
}

export function SearchResultView({ searchText, onReset }: SearchResultViewProps) {
  return (
    <div className="flex h-full w-full items-center justify-between">
      <div className="mr-6 flex shrink-0 items-center">
        <LogoButton onClick={onReset} />
      </div>

      <div className="flex-1 overflow-auto px-4 py-1">
        <p className="text-muted-foreground text-sm">{searchText || '—'}</p>
      </div>

      <div className="ml-auto">
        <Button variant="ghost" size="sm" onClick={onReset}>
          关闭
        </Button>
      </div>
    </div>
  )
}
