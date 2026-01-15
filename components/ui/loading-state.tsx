import { memo, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/helpers'

interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children?: ReactNode
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

export const LoadingState = memo(
  ({ message = '加载中...', size = 'md', className, children }: LoadingStateProps) => {
    return (
      <div className={cn('flex items-center justify-center space-x-2', className)}>
        <Loader2 className={cn('animate-spin text-gray-400', sizeMap[size])} />
        {message && <span className="text-sm text-gray-600">{message}</span>}
        {children}
      </div>
    )
  }
)

LoadingState.displayName = 'LoadingState'
