import { memo } from 'react'

interface LoadingSkeletonProps {
  className?: string
  height?: string
}

export const LoadingSkeleton = memo(({ className = '', height = '8rem' }: LoadingSkeletonProps) => {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700 ${className} `}
      style={{ height }}
    >
      <div className="animate-shimmer h-full w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700"></div>
    </div>
  )
})

LoadingSkeleton.displayName = 'LoadingSkeleton'
