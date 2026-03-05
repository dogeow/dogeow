import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/helpers'
import { Button } from '@/components/ui/button'
import { PageTitle } from './PageTitle'

interface PageHeaderProps {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
  titleClassName?: string
  showBackButton?: boolean
  onBackClick?: () => void
  backButtonLabel?: string
}

/**
 * 统一页面头部，支持返回、标题、副标题和操作区。
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
  titleClassName,
  showBackButton = false,
  onBackClick,
  backButtonLabel = '返回',
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between',
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex min-w-0 items-center gap-3">
          {showBackButton && (
            <Button
              variant="outline"
              size="icon"
              onClick={onBackClick}
              aria-label={backButtonLabel}
              className="h-9 w-9 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <PageTitle className={cn('text-xl sm:text-2xl', titleClassName)}>{title}</PageTitle>
        </div>
        {description ? (
          <p className={cn('text-muted-foreground text-sm', showBackButton ? 'pl-12' : undefined)}>
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  )
}
