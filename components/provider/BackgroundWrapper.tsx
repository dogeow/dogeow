'use client'

import React from 'react'
import { useBackgroundStore } from '@/stores/backgroundStore'
import { cn } from '@/lib/helpers'

interface BackgroundWrapperProps {
  children: React.ReactNode
}

export function BackgroundWrapper({ children }: BackgroundWrapperProps) {
  const { backgroundImage } = useBackgroundStore()

  return (
    <div
      className={cn(
        'flex min-h-[calc(100vh-var(--navbar-height,64px))] flex-col',
        backgroundImage && 'bg-cover bg-fixed bg-center'
      )}
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {}}
    >
      {children}
    </div>
  )
}
