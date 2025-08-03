'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { ChatRoom } from '../types'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/helpers'
import chatCache from '@/lib/cache/chat-cache'
import { useTranslation } from '@/hooks/useTranslation'
import { Search, Users, MessageSquare, Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useChatStore } from '../chatStore'

interface LazyRoomListProps {
  onRoomSelect: (room: ChatRoom) => void
  selectedRoomId?: number
  className?: string
}

interface RoomItemProps {
  room: ChatRoom
  isSelected: boolean
  onClick: () => void
  isVisible: boolean
}

function RoomItem({ room, isSelected, onClick, isVisible }: RoomItemProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleImageLoad = () => setImageLoaded(true)
  const handleImageError = () => setImageError(true)

  if (!isVisible) {
    return <Skeleton className="h-16 w-full" />
  }

  return (
    <div
      className={cn(
        'hover:bg-muted flex cursor-pointer items-center space-x-3 rounded-lg p-3 transition-colors',
        isSelected && 'bg-muted'
      )}
      onClick={onClick}
    >
      {/* Room avatar */}
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage
            src={room.avatar}
            alt={room.name}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ display: imageLoaded && !imageError ? 'block' : 'none' }}
          />
          <AvatarFallback className="text-xs">{room.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        {room.online_count && room.online_count > 0 && (
          <Badge
            variant="secondary"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
          >
            {room.online_count}
          </Badge>
        )}
      </div>

      {/* Room info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="truncate text-sm font-medium">{room.name}</h3>
        </div>
        <div className="text-muted-foreground flex items-center space-x-2 text-xs">
          <MessageSquare className="h-3 w-3" />
          <span>{room.message_count || 0}</span>
          {room.last_activity && (
            <>
              <Clock className="h-3 w-3" />
              <span>
                {new Date(room.last_activity).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function useIntersectionObserver(
  elementRef: React.RefObject<Element | null>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, options)

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [elementRef, options])

  return isIntersecting
}

function LazyRoomItem({ room, isSelected, onClick }: Omit<RoomItemProps, 'isVisible'>) {
  const elementRef = useRef<HTMLDivElement>(null)
  const isVisible = useIntersectionObserver(elementRef)

  return (
    <div ref={elementRef}>
      <RoomItem room={room} isSelected={isSelected} onClick={onClick} isVisible={isVisible} />
    </div>
  )
}

function RoomListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}

function EmptyRoomList() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Users className="text-muted-foreground h-12 w-12" />
      <h3 className="mt-4 text-lg font-semibold">{t('chat.no_rooms_available')}</h3>
      <p className="text-muted-foreground mt-2 text-sm">{t('chat.select_room_to_see_users')}</p>
    </div>
  )
}

function RoomSearch({
  value,
  onChange,
  placeholder = 'Search rooms...',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const { t } = useTranslation()
  return (
    <div className="relative">
      <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <Input
        placeholder={t('chat.search_rooms', placeholder)}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="pl-9"
      />
    </div>
  )
}

export function LazyRoomList({ onRoomSelect, selectedRoomId, className }: LazyRoomListProps) {
  const { t } = useTranslation()
  const { rooms, isLoading, loadRooms } = useChatStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'activity' | 'members'>('activity')

  // Load rooms with caching
  const loadRoomsWithCache = useCallback(async () => {
    // Check cache first
    const cachedRooms = chatCache.getCachedRoom('all')
    if (cachedRooms) {
      return
    }

    // Load from API and cache
    try {
      await loadRooms()
      // Cache will be updated in the store
    } catch (error) {
      console.error('Failed to load rooms:', error)
    }
  }, [loadRooms])

  // Load rooms on mount
  useEffect(() => {
    loadRoomsWithCache()
  }, [loadRoomsWithCache])

  // Filter and sort rooms
  const filteredAndSortedRooms = useMemo(() => {
    let filtered = rooms

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = rooms.filter(
        room =>
          room.name.toLowerCase().includes(query) || room.description?.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'members':
          return (b.online_count || 0) - (a.online_count || 0)
        case 'activity':
        default:
          const aTime = a.last_activity ? new Date(a.last_activity).getTime() : 0
          const bTime = b.last_activity ? new Date(b.last_activity).getTime() : 0
          return bTime - aTime
      }
    })

    return sorted
  }, [rooms, searchQuery, sortBy])

  // Handle room selection
  const handleRoomSelect = useCallback(
    (room: ChatRoom) => {
      // Cache the selected room
      chatCache.cacheRoom(room)
      onRoomSelect(room)
    },
    [onRoomSelect]
  )

  if (isLoading && rooms.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="p-4">
          <Skeleton className="h-10 w-full" />
        </div>
        <RoomListSkeleton />
      </div>
    )
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Search and filters */}
      <div className="space-y-3 p-4">
        <RoomSearch value={searchQuery} onChange={setSearchQuery} />

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">{t('chat.sort_by', 'Sort by:')}</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="border-input bg-background focus:border-primary rounded border px-2 py-1 text-sm focus:outline-none"
          >
            <option value="activity">{t('chat.recent_activity', 'Recent Activity')}</option>
            <option value="name">{t('chat.name', 'Name')}</option>
            <option value="members">{t('chat.members', 'Members')}</option>
          </select>
        </div>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto">
        {filteredAndSortedRooms.length === 0 ? (
          searchQuery ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">
                {t('chat.no_rooms_found_matching', 'No rooms found matching "{query}"').replace(
                  '{query}',
                  searchQuery
                )}
              </p>
            </div>
          ) : (
            <EmptyRoomList />
          )
        ) : (
          <div className="space-y-1 p-2">
            {filteredAndSortedRooms.map(room => (
              <LazyRoomItem
                key={room.id}
                room={room}
                isSelected={selectedRoomId === room.id}
                onClick={() => handleRoomSelect(room)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Room count */}
      <div className="border-t p-2 text-center">
        <span className="text-muted-foreground text-xs">
          {t(
            'chat.room_count',
            `${filteredAndSortedRooms.length} room${filteredAndSortedRooms.length !== 1 ? 's' : ''}`
          )}
          {searchQuery && ` ${t('chat.filtered_from', `(filtered from ${rooms.length})`)}`}
        </span>
      </div>
    </div>
  )
}
