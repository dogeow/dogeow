"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/helpers'

interface UploadButtonProps {
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  title: string
  accept?: string
}

export function UploadButton({ onUpload, title, accept = "image/*" }: UploadButtonProps) {
  return (
    <motion.div 
      whileHover={{ scale: 1.05 }} 
      whileTap={{ scale: 0.95 }} 
      className="shrink-0"
    >
      <label 
        className={cn(
          "p-1 h-9 w-9 rounded-md overflow-hidden relative flex items-center justify-center cursor-pointer",
          "bg-primary/10 hover:bg-primary/20 border-2 border-dashed border-primary/30"
        )}
        title={title}
      >
        <Plus className="h-5 w-5 text-primary/70" />
        <input 
          type="file" 
          accept={accept} 
          className="hidden" 
          onChange={onUpload} 
        />
      </label>
    </motion.div>
  )
} 