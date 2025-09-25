import { memo, ReactNode } from 'react'
import { Button } from './button'
import { cn } from '@/lib/helpers'

interface EmptyStateProps {
  icon?: ReactNode | string
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export const EmptyState = memo(
  ({ icon = '📝', title, description, action, className }: EmptyStateProps) => {
    return (
      <div className={cn('py-12 text-center', className)}>
        <div className="text-muted-foreground">
          {typeof icon === 'string' ? (
            <div className="mb-4 text-4xl" role="img" aria-label={title}>
              {icon}
            </div>
          ) : (
            <div className="mb-4 flex justify-center">{icon}</div>
          )}

          <h3 className="mb-2 text-lg font-medium">{title}</h3>

          {description && <p className="mb-4 text-sm">{description}</p>}

          {action && (
            <Button onClick={action.onClick} variant="outline">
              {action.label}
            </Button>
          )}
        </div>
      </div>
    )
  }
)

EmptyState.displayName = 'EmptyState'
