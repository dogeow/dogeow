'use client'

import React from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/helpers'

interface UploadButtonProps {
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  title: string
  accept?: string
}

export function UploadButton({ onUpload, title, accept = 'image/*' }: UploadButtonProps) {
  return (
    <div className="shrink-0">
      <label
        className={cn(
          'border-primary/30 bg-primary/10 hover:bg-primary/20 relative flex aspect-[16/9] cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed'
        )}
        title={title}
      >
        <Plus className="text-primary/70 h-6 w-6" />
        <input type="file" accept={accept} className="hidden" onChange={onUpload} />
      </label>
    </div>
  )
}
