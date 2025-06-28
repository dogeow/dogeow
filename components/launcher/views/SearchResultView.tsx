import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown'
import Logo from '@/public/80.png'

interface SearchResultViewProps {
  searchText: string
  onReset: () => void
}

export function SearchResultView({ searchText, onReset }: SearchResultViewProps) {
  return (
    <div className="h-full flex items-center justify-between w-full">
      <div className="flex items-center shrink-0 mr-6">
        <Image 
          src={Logo} 
          alt="apps" 
          className="h-10 w-10 cursor-pointer" 
          onClick={onReset}
        />
      </div>
      
      <div className="flex-1 overflow-auto px-4 py-1">
        <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:mt-2 prose-headings:mb-1 prose-p:my-1 prose-li:my-0">
          <ReactMarkdown>
            {searchText}
          </ReactMarkdown>
        </div>
      </div>
      
      <div className="ml-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
        >
          关闭
        </Button>
      </div>
    </div>
  )
} 