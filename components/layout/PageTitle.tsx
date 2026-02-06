import { cn } from '@/lib/helpers'

interface PageTitleProps {
  children: React.ReactNode
  className?: string
}

/**
 * 统一的页面标题组件
 *
 * 所有页面的一级标题统一为 text-2xl font-bold，保证视觉一致性。
 */
export function PageTitle({ children, className }: PageTitleProps) {
  return <h1 className={cn('text-2xl font-bold tracking-tight', className)}>{children}</h1>
}
