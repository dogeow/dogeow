import React, { memo } from 'react'
import { Hash, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/useTranslation'

interface RoomListEmptyProps {
  searchQuery: string
  onRefresh?: () => void
}

export const RoomListEmpty = memo<RoomListEmptyProps>(({ searchQuery, onRefresh }) => {
  const { t } = useTranslation()

  return (
    <div className="text-muted-foreground p-4 text-center">
      <Hash className="mx-auto mb-2 h-8 w-8 opacity-50" />
      <p className="text-sm">
        {searchQuery.trim()
          ? t('chat.no_rooms_found', 'No rooms found')
          : t('chat.no_rooms_available', 'No chat rooms available')}
      </p>
      <p className="mt-1 text-xs">
        {searchQuery.trim()
          ? t('chat.try_different_search', 'Try a different search term')
          : t('chat.create_to_get_started', 'Create one to get started')}
      </p>
      {!searchQuery.trim() && onRefresh && (
        <Button variant="outline" size="sm" className="mt-3" onClick={onRefresh}>
          {t('chat.refresh_rooms', 'Refresh Rooms')}
        </Button>
      )}
    </div>
  )
})

RoomListEmpty.displayName = 'RoomListEmpty'
