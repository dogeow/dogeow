'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Plus,
  Users,
  Hash,
  AlertCircle,
  Search,
  Star,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/helpers'
import useChatStore from '@/stores/chatStore'
import { CreateRoomDialog } from './CreateRoomDialog'
import { EditRoomDialog } from './EditRoomDialog'
import { DeleteRoomDialog } from './DeleteRoomDialog'
import { NotificationBadge } from './NotificationBadge'
import type { ChatRoom } from '../types'

interface ChatRoomListProps {
  onRoomSelect?: () => void
}

export function ChatRoomList({ onRoomSelect }: ChatRoomListProps = {}) {
  const {
    rooms,
    currentRoom,
    isLoading,
    error,
    setCurrentRoom,
    joinRoom,
    getRoomUnreadCount,
    hasUnreadMentions,
  } = useChatStore()

  // Get loadRooms function with stable reference
  const loadRooms = useCallback(() => {
    return useChatStore.getState().loadRooms()
  }, [])

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<ChatRoom | null>(null)
  const [deletingRoom, setDeletingRoom] = useState<ChatRoom | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [favoriteRooms, setFavoriteRooms] = useState<Set<number>>(new Set())
  const [recentRooms, setRecentRooms] = useState<number[]>([])
  const [filterType, setFilterType] = useState<'all' | 'favorites' | 'recent'>('all')

  // Removed automatic loadRooms call to prevent duplicate API calls
  // loadRooms is now handled by the parent ChatPage component

  // Load favorites and recent rooms from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('chat-favorite-rooms')
    const savedRecent = localStorage.getItem('chat-recent-rooms')

    if (savedFavorites) {
      try {
        setFavoriteRooms(new Set(JSON.parse(savedFavorites)))
      } catch (error) {
        console.error('Failed to load favorite rooms:', error)
      }
    }

    if (savedRecent) {
      try {
        setRecentRooms(JSON.parse(savedRecent))
      } catch (error) {
        console.error('Failed to load recent rooms:', error)
      }
    }
  }, [])

  // Filter and search rooms
  const filteredRooms = useMemo(() => {
    let filtered = rooms

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        room =>
          room.name.toLowerCase().includes(query) || room.description?.toLowerCase().includes(query)
      )
    }

    // Apply type filter
    switch (filterType) {
      case 'favorites':
        filtered = filtered.filter(room => favoriteRooms.has(room.id))
        break
      case 'recent':
        filtered = filtered.filter(room => recentRooms.includes(room.id))
        // Sort by recent order
        filtered.sort((a, b) => {
          const aIndex = recentRooms.indexOf(a.id)
          const bIndex = recentRooms.indexOf(b.id)
          return aIndex - bIndex
        })
        break
      default:
        // Sort by unread count, then by name
        filtered.sort((a, b) => {
          const aUnread = getRoomUnreadCount(a.id)
          const bUnread = getRoomUnreadCount(b.id)
          if (aUnread !== bUnread) {
            return bUnread - aUnread
          }
          return a.name.localeCompare(b.name)
        })
    }

    return filtered
  }, [rooms, searchQuery, filterType, favoriteRooms, recentRooms, getRoomUnreadCount])

  const handleRoomSelect = async (room: ChatRoom) => {
    if (currentRoom?.id === room.id) return

    try {
      await joinRoom(room.id)
      setCurrentRoom(room)

      // Add to recent rooms
      const newRecent = [room.id, ...recentRooms.filter(id => id !== room.id)].slice(0, 10)
      setRecentRooms(newRecent)
      localStorage.setItem('chat-recent-rooms', JSON.stringify(newRecent))

      // Call the callback for mobile sheet closing
      onRoomSelect?.()
    } catch (error) {
      console.error('Failed to join room:', error)
    }
  }

  const toggleFavorite = (roomId: number, event: React.MouseEvent) => {
    event.stopPropagation()
    const newFavorites = new Set(favoriteRooms)

    if (newFavorites.has(roomId)) {
      newFavorites.delete(roomId)
    } else {
      newFavorites.add(roomId)
    }

    setFavoriteRooms(newFavorites)
    localStorage.setItem('chat-favorite-rooms', JSON.stringify([...newFavorites]))
  }

  const handleEditRoom = (room: ChatRoom, event: React.MouseEvent) => {
    event.stopPropagation()
    setEditingRoom(room)
  }

  const handleDeleteRoom = (room: ChatRoom, event: React.MouseEvent) => {
    event.stopPropagation()
    setDeletingRoom(room)
  }

  const handleCreateRoom = () => {
    setIsCreateDialogOpen(true)
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border-destructive/20 rounded-lg border p-4">
        <div className="text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Error loading rooms</span>
        </div>
        <p className="text-destructive/80 mt-1 text-sm">{error?.message || 'Unknown error'}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => loadRooms()}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="space-y-3 border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Chat Rooms</h2>
          <Button size="sm" onClick={handleCreateRoom} disabled={isLoading}>
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
          <Input
            placeholder="Search rooms..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-1">
          <Button
            variant={filterType === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterType('all')}
            className="h-8"
          >
            All
          </Button>
          <Button
            variant={filterType === 'favorites' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterType('favorites')}
            className="h-8"
          >
            <Star className="mr-1 h-3 w-3" />
            Favorites
          </Button>
          <Button
            variant={filterType === 'recent' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterType('recent')}
            className="h-8"
          >
            <Clock className="mr-1 h-3 w-3" />
            Recent
          </Button>
        </div>
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && rooms.length === 0 ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-muted-foreground p-4 text-center">
            <Hash className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">
              {searchQuery.trim() ? 'No rooms found' : 'No chat rooms available'}
            </p>
            <p className="mt-1 text-xs">
              {searchQuery.trim() ? 'Try a different search term' : 'Create one to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredRooms.map(room => {
              const unreadCount = getRoomUnreadCount(room.id)
              const hasMentions = hasUnreadMentions(room.id)
              const isActive = currentRoom?.id === room.id

              return (
                <div
                  key={room.id}
                  className={cn(
                    'group hover:bg-accent/50 w-full cursor-pointer rounded-lg p-3 text-left transition-colors',
                    'focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-none',
                    isActive && 'bg-accent text-accent-foreground'
                  )}
                  onClick={() => handleRoomSelect(room)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleRoomSelect(room)
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Hash className="text-muted-foreground h-4 w-4 shrink-0" />
                        <span className="truncate font-medium">{room.name}</span>
                        {hasMentions && (
                          <NotificationBadge
                            count={1}
                            hasMentions={true}
                            showIcon={true}
                            size="sm"
                          />
                        )}
                        {favoriteRooms.has(room.id) && (
                          <Star className="h-3 w-3 fill-current text-yellow-500" />
                        )}
                      </div>

                      {room.description && (
                        <p className="text-muted-foreground mt-1 truncate text-xs">
                          {room.description}
                        </p>
                      )}

                      <div className="mt-2 flex items-center gap-2">
                        <div className="text-muted-foreground flex items-center gap-1 text-xs">
                          <Users className="h-3 w-3" />
                          <span>{room.online_count || 0}</span>
                        </div>

                        {unreadCount > 0 && (
                          <NotificationBadge
                            count={unreadCount}
                            hasMentions={hasMentions}
                            size="sm"
                          />
                        )}
                      </div>
                    </div>

                    {/* Room Actions */}
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={e => toggleFavorite(room.id, e)}
                      >
                        <Star
                          className={cn(
                            'h-3 w-3',
                            favoriteRooms.has(room.id)
                              ? 'fill-current text-yellow-500'
                              : 'text-muted-foreground'
                          )}
                        />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={e => e.stopPropagation()}
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={e => handleEditRoom(room, e)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Room
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={e => handleDeleteRoom(room, e)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Room
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateRoomDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />

      {editingRoom && (
        <EditRoomDialog
          room={editingRoom}
          open={!!editingRoom}
          onOpenChange={open => !open && setEditingRoom(null)}
        />
      )}

      {deletingRoom && (
        <DeleteRoomDialog
          room={deletingRoom}
          open={!!deletingRoom}
          onOpenChange={open => !open && setDeletingRoom(null)}
        />
      )}
    </div>
  )
}
