import { ChevronRight, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BreadcrumbSkeletonProps {
  itemCount?: number
}

export default function BreadcrumbSkeleton({ itemCount = 2 }: BreadcrumbSkeletonProps) {
  return (
    <div className="flex items-center text-sm mt-4">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2"
        disabled
      >
        <Home className="h-4 w-4 mr-1" />
        主目录
      </Button>

      {Array.from({ length: itemCount }, (_, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
          <div className="animate-pulse h-7 w-16 bg-muted rounded px-2"></div>
        </div>
      ))}
    </div>
  )
} 