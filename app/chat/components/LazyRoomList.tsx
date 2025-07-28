'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef, RefObject } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/helpers'
import useChatStore from '@/stores/chatStore'
import chatCache from '@/lib/cache/chat-cache'
import type { ChatRoom } from '@/types/chat'
import { Badge } from '@/components/ui/badge'
import { UsersIcon } from 'lucide-react'
import Image from 'next/image'

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

// Individual room item component with lazy loading
function RoomItem({ room, isSelected, onClick, isVisible }: RoomItemProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Only render content when visible (intersection observer optimization)
  if (!isVisible) {
    return (
      <div className="h-16 w-full">
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  const handleImageLoad = () => setImageLoaded(true)
  const handleImageError = () => setImageError(true)

  // Generate room avatar from name
  const roomInitials = room.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      className={cn(
        'hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors',
        isSelected && 'bg-primary/10 border-primary border'
      )}
      onClick={onClick}
    >
      {/* Room Avatar */}
      <div className="relative flex-shrink-0">
        {room.avatar && !imageError ? (
          <div className="relative h-10 w-10">
            <Image
              src={room.avatar}
              alt={room.name}
              className={cn(
                'h-full w-full rounded-full object-cover transition-opacity',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={handleImageLoad}
              onError={handleImageError}
              width={40}
              height={40}
            />
            {!imageLoaded && <Skeleton className="absolute inset-0 h-full w-full rounded-full" />}
          </div>
        ) : (
          <div className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium">
            {roomInitials}
          </div>
        )}

        {/* Online indicator */}
        {(room.online_count ?? 0) > 0 && (
          <Badge variant="secondary" className="ml-auto">
            <UsersIcon className="mr-1 h-3 w-3" />
            {room.online_count}
          </Badge>
        )}
      </div>

      {/* Room Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="truncate text-sm font-medium">{room.name}</h3>
          <span className="text-muted-foreground text-xs">{room.online_count} online</span>
        </div>

        {room.description && (
          <p className="text-muted-foreground truncate text-xs">{room.description}</p>
        )}

        <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
          <span>{room.message_count || 0} messages</span>
          {room.last_activity && (
            <span>• Last active {new Date(room.last_activity).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      {/* Unread indicator */}
      {room.unread_count && room.unread_count > 0 && (
        <div className="bg-primary text-primary-foreground flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium">
          {room.unread_count > 99 ? '99+' : room.unread_count}
        </div>
      )}
    </div>
  )
}

// Intersection Observer hook for lazy loading
function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [elementRef, options])

  return isVisible
}

// Lazy room item wrapper with intersection observer
function LazyRoomItem({ room, isSelected, onClick }: Omit<RoomItemProps, 'isVisible'>) {
  const ref = useRef<HTMLDivElement>(null)
  const isVisible = useIntersectionObserver(ref as RefObject<HTMLDivElement>, { threshold: 0.1 })

  return (
    <div ref={ref}>
      <RoomItem room={room} isSelected={isSelected} onClick={onClick} isVisible={isVisible} />
    </div>
  )
}

// Loading skeleton for room list
function RoomListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Empty state component
function EmptyRoomList() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-muted-foreground mb-4">
        <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-medium">No chat rooms</h3>
      <p className="text-muted-foreground text-sm">Create a room to start chatting!</p>
    </div>
  )
}

// Search/filter component
function RoomSearch({
  value,
  onChange,
  placeholder = 'Search rooms...',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div className="relative">
      <svg
        className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="border-input bg-background placeholder:text-muted-foreground focus:border-primary focus:ring-primary w-full rounded-lg border px-10 py-2 text-sm focus:ring-1 focus:outline-none"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  )
}

export function LazyRoomList({ onRoomSelect, selectedRoomId, className }: LazyRoomListProps) {
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
          <span className="text-muted-foreground text-sm">Sort by:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="border-input bg-background focus:border-primary rounded border px-2 py-1 text-sm focus:outline-none"
          >
            <option value="activity">Recent Activity</option>
            <option value="name">Name</option>
            <option value="members">Members</option>
          </select>
        </div>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto">
        {filteredAndSortedRooms.length === 0 ? (
          searchQuery ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">
                No rooms found matching &quot;{searchQuery}&quot;
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
          {filteredAndSortedRooms.length} room{filteredAndSortedRooms.length !== 1 ? 's' : ''}
          {searchQuery && ` (filtered from ${rooms.length})`}
        </span>
      </div>
    </div>
  )
}
