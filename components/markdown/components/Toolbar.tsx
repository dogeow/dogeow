import { ReactNode } from 'react'

interface ToolbarProps {
  children: ReactNode
}

export const Toolbar = ({ children }: ToolbarProps) => {
  return (
    <div className="flex items-center flex-wrap gap-1 p-2 bg-background border rounded-md mb-2">
      {children}
    </div>
  )
} 