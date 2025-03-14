"use client"

import React from 'react'
import { useBackgroundStore } from '@/stores/backgroundStore'

interface BackgroundWrapperProps {
  children: React.ReactNode
}

export function BackgroundWrapper({ children }: BackgroundWrapperProps) {
  const { backgroundImage } = useBackgroundStore()
  
  const style = backgroundImage
    ? {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }
    : {}
  
  return (
    <div className="min-h-screen" style={style}>
      {children}
    </div>
  )
} 