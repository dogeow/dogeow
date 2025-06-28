import React from 'react'

interface ViewWrapperProps {
  children: React.ReactNode
}

export function ViewWrapper({ children }: ViewWrapperProps) {
  return (
    <div className="h-full flex items-center">
      {children}
    </div>
  )
} 