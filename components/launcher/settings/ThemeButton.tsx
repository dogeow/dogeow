"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/helpers'
import { Check, Trash2 } from 'lucide-react'

interface ThemeButtonProps {
  theme: {
    id: string
    name: string
    color: string
  }
  isSelected: boolean
  isCustom?: boolean
  onSelect: (id: string) => void
  onRemove?: (id: string) => void
}

export function ThemeButton({ 
  theme, 
  isSelected, 
  isCustom = false, 
  onSelect, 
  onRemove 
}: ThemeButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="shrink-0 relative"
    >
      <Button 
        variant="ghost" 
        className={cn(
          "p-1 h-9 w-9 rounded-md overflow-hidden relative",
          isSelected && "ring-2 ring-primary"
        )}
        onClick={() => onSelect(theme.id)}
        title={theme.name}
        style={{ backgroundColor: theme.color }}
      >
        {isSelected && (
          <Check className="h-5 w-5 text-white" />
        )}
      </Button>
      
      {isCustom && onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-background border shadow-sm hover:bg-destructive hover:text-destructive-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(theme.id);
          }}
          title={`删除 ${theme.name}`}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </motion.div>
  )
} 