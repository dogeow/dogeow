'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/helpers'
import Image from 'next/image'

interface BackgroundButtonProps {
  background: {
    id: string
    name: string
    url: string
  }
  isSelected: boolean
  onSelect: (url: string) => void
}

export function BackgroundButton({ background, isSelected, onSelect }: BackgroundButtonProps) {
  return (
    <div className="shrink-0 transition-transform hover:scale-105 active:scale-95">
      <Button
        variant="ghost"
        className={cn(
          'relative h-9 w-9 overflow-hidden rounded-md p-1',
          isSelected && 'ring-primary ring-2'
        )}
        onClick={() => onSelect(background.url)}
        title={background.name}
      >
        {background.url ? (
          <Image
            src={`/images/backgrounds/${background.url}`}
            alt={background.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="bg-muted flex h-full w-full items-center justify-center">
            <span className="text-xs">None</span>
          </div>
        )}
      </Button>
    </div>
  )
}
