import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import MarkdownPreview from '@/components/novel-editor/markdown-preview'
import Logo from '@/public/80.png'

interface SearchResultViewProps {
  searchText: string
  onReset: () => void
}

export function SearchResultView({ searchText, onReset }: SearchResultViewProps) {
  return (
    <div className="flex h-full w-full items-center justify-between">
      <div className="mr-6 flex shrink-0 items-center">
        <Image
          src={Logo}
          alt="apps"
          width={40}
          height={40}
          className="h-10 w-10 cursor-pointer"
          onClick={onReset}
        />
      </div>

      <div className="flex-1 overflow-auto px-4 py-1">
        <div className="prose prose-sm dark:prose-invert prose-headings:mt-2 prose-headings:mb-1 prose-p:my-1 prose-li:my-0 max-w-none">
          <MarkdownPreview content={searchText} />
        </div>
      </div>

      <div className="ml-auto">
        <Button variant="ghost" size="sm" onClick={onReset}>
          关闭
        </Button>
      </div>
    </div>
  )
}
