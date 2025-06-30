import { memo } from "react"

interface LoadingSkeletonProps {
  className?: string
  height?: string
}

export const LoadingSkeleton = memo(({ 
  className = '', 
  height = '8rem' 
}: LoadingSkeletonProps) => {
  return (
    <div 
      className={`
        bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg
        ${className}
      `}
      style={{ height }}
    >
      <div className="h-full w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-shimmer">
      </div>
    </div>
  )
})

LoadingSkeleton.displayName = 'LoadingSkeleton' 