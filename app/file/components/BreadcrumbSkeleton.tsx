import { ChevronRight, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BreadcrumbSkeletonProps {
  itemCount?: number
}

export default function BreadcrumbSkeleton({ itemCount = 2 }: BreadcrumbSkeletonProps) {
  return (
    <div className="mt-4 flex items-center text-sm">
      <Button variant="ghost" size="sm" className="h-7 px-2" disabled>
        <Home className="mr-1 h-4 w-4" />
        主目录
      </Button>

      {Array.from({ length: itemCount }, (_, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="text-muted-foreground mx-1 h-4 w-4" />
          <div className="bg-muted h-7 w-16 animate-pulse rounded px-2"></div>
        </div>
      ))}
    </div>
  )
}
