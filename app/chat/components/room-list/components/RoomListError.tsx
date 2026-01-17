import React, { memo } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RoomListErrorProps {
  error: Error | null
  onRetry: () => void
}

export const RoomListError = memo<RoomListErrorProps>(({ error, onRetry }) => {
  return (
    <div className="bg-destructive/10 border-destructive/20 rounded-lg border p-4">
      <div className="text-destructive flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Error loading rooms</span>
      </div>
      <p className="text-destructive/80 mt-1 text-sm">{error?.message || 'Unknown error'}</p>
      <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  )
})

RoomListError.displayName = 'RoomListError'
