import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BackButtonProps {
  onClick: () => void
  title?: string
  className?: string
}

export function BackButton({ onClick, title = '返回', className = '' }: BackButtonProps) {
  return (
    <div className="transition-transform hover:scale-110 active:scale-90">
      <Button
        variant="ghost"
        size="icon"
        className={`mr-1 h-7 w-7 ${className}`}
        onClick={onClick}
        title={title}
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="sr-only">{title}</span>
      </Button>
    </div>
  )
}

export default BackButton
