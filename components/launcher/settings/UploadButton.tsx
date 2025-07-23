'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/helpers'

interface UploadButtonProps {
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  title: string
  accept?: string
}

export function UploadButton({ onUpload, title, accept = 'image/*' }: UploadButtonProps) {
  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="shrink-0">
      <label
        className={cn(
          'relative flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-md p-1',
          'bg-primary/10 hover:bg-primary/20 border-primary/30 border-2 border-dashed'
        )}
        title={title}
      >
        <Plus className="text-primary/70 h-5 w-5" />
        <input type="file" accept={accept} className="hidden" onChange={onUpload} />
      </label>
    </motion.div>
  )
}
