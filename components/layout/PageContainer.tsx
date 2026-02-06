import { cn } from '@/lib/helpers'

interface PageContainerProps {
  children: React.ReactNode
  /** 额外的 className */
  className?: string
  /** 是否全屏（不加内边距），用于游戏等全屏页面 */
  fullScreen?: boolean
  /** 限制最大宽度，默认不额外限制（由 layout 的 max-w-7xl 控制） */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'none'
}

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  none: '',
} as const

/**
 * 统一的页面容器组件
 *
 * 提供一致的内边距和最大宽度，保证各页面间距统一。
 * - 默认: px-3 sm:px-4 py-4
 * - fullScreen: 无内边距（用于游戏等需要全屏的页面）
 */
export function PageContainer({
  children,
  className,
  fullScreen = false,
  maxWidth = 'none',
}: PageContainerProps) {
  if (fullScreen) {
    return <div className={cn('h-full w-full', className)}>{children}</div>
  }

  return (
    <div
      className={cn(
        'mx-auto w-full px-3 py-4 sm:px-4',
        maxWidth !== 'none' && maxWidthMap[maxWidth],
        className
      )}
    >
      {children}
    </div>
  )
}
