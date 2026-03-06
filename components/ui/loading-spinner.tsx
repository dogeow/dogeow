import { memo } from 'react'
import { cn } from '@/lib/helpers'

// ✅ 显式定义并导出 Props 类型
export interface LoadingSpinnerProps {
  /** 微调器大小 */
  size?: 'sm' | 'md' | 'lg'
  /** 自定义样式 */
  className?: string
  /** 无障碍标签，屏幕阅读器会读取 */
  'aria-label'?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
} as const

/**
 * 旋转加载微调器
 * @example
 * <LoadingSpinner size="md" />
 * <LoadingSpinner loading={isLoading} />
 */
export const LoadingSpinner = memo(
  ({ size = 'md', className, 'aria-label': ariaLabel = '加载中' }: LoadingSpinnerProps) => {
    return (
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-muted border-t-primary',
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
