import { memo } from 'react'
import { cn } from '@/lib/helpers'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  'aria-label'?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
} as const

export const LoadingSpinner = memo(
  ({ size = 'md', className, 'aria-label': ariaLabel = '加载中' }: LoadingSpinnerProps) => {
    return (
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
          sizeClasses[size],
          className
        )}
        role="status"
        aria-label={ariaLabel}
      >
        <span className="sr-only">{ariaLabel}</span>
      </div>
    )
  }
)

LoadingSpinner.displayName = 'LoadingSpinner'
