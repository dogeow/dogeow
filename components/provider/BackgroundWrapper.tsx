"use client"

import React from 'react'
import { useBackgroundStore } from '@/stores/backgroundStore'
import { cn } from '@/lib/utils'

interface BackgroundWrapperProps {
  children: React.ReactNode
}

export function BackgroundWrapper({ children }: BackgroundWrapperProps) {
  const { backgroundImage } = useBackgroundStore()
  
  return (
    <div 
      className={cn(
        "min-h-[calc(100vh-var(--navbar-height,64px))]",
        backgroundImage && "bg-cover bg-center bg-fixed"
      )}
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {}}
    >
      {children}
    </div>
  )
} 