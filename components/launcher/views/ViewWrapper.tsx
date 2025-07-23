import React from 'react'

interface ViewWrapperProps {
  children: React.ReactNode
}

export function ViewWrapper({ children }: ViewWrapperProps) {
  return <div className="flex h-full items-center">{children}</div>
}
