'use client'

import { useState, useCallback } from 'react'
import { useFormModal } from '@/hooks/useFormModal'
import { Skeleton } from '@/components/ui/skeleton'
import useChatStore from '@/app/chat/chatStore'
import { CreateRoomDialog } from './CreateRoomDialog'
import { EditRoomDialog } from './EditRoomDialog'
import { DeleteRoomDialog } from './DeleteRoomDialog'
import { useRoomFilters } from './room-list/hooks/useRoomFilters'
import { useRoomPreferences } from './room-list/hooks/useRoomPreferences'
import { RoomListHeader } from './room-list/components/RoomListHeader'
import { RoomListItem } from './room-list/components/RoomListItem'
import { RoomListEmpty } from './room-list/components/RoomListEmpty'
import { RoomListError } from './room-list/components/RoomListError'
import type { ChatRoom } from '../types'

interface ChatRoomListProps {
  onRoomSelect?: () => void
  showHeader?: boolean
}

export function ChatRoomList({ onRoomSelect, showHeader = true }: ChatRoomListProps = {}) {
  const {
    rooms = [],
    currentRoom,
    isLoading,
    error,
    setCurrentRoom,
    joinRoom,
    loadRooms,
  } = useChatStore()

  const createModal = useFormModal<null>('create')
  const editModal = useFormModal<number>('edit')
  const deleteModal = useFormModal<number>('delete')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'favorites' | 'recent'>('all')

  const { favoriteRooms, recentRooms, toggleFavorite, addRecentRoom } = useRoomPreferences()

  const filteredRooms = useRoomFilters({
    rooms,
    searchQuery,
    filterType,
    favoriteRooms,
    recentRooms,
  })

  // 选择房间
  const handleRoomSelect = useCallback(
    async (room: ChatRoom) => {
      if (currentRoom?.id === room.id) {
        onRoomSelect?.()
        return
      }

      try {
        console.log('ChatRoomList: Selecting room:', room)

        setCurrentRoom(room)
        await joinRoom(room.id)
        addRecentRoom(room.id)
      } catch (error) {
        console.error('Failed to join room:', error)
        setCurrentRoom(null)
      } finally {
        onRoomSelect?.()
      }
    },
    [currentRoom, setCurrentRoom, joinRoom, addRecentRoom, onRoomSelect]
  )

  // 切换收藏
  const handleToggleFavorite = useCallback(
    (roomId: number, event: React.MouseEvent) => {
      event.stopPropagation()
      toggleFavorite(roomId)
    },
    [toggleFavorite]
  )

  // 编辑房间
  const handleEditRoom = useCallback((room: ChatRoom, event: React.MouseEvent) => {
    event.stopPropagation()
    editModal.openModal(room.id)
  }, [editModal])

  // 删除房间
  const handleDeleteRoom = useCallback((room: ChatRoom, event: React.MouseEvent) => {
    event.stopPropagation()
    deleteModal.openModal(room.id)
  }, [deleteModal])

  // 打开新建房间弹窗
  const handleCreateRoom = useCallback(() => {
    createModal.openModal(null)
  }, [createModal])

  // 刷新房间列表
  const handleRefresh = useCallback(() => {
    console.log('ChatRoomList: Manual refresh triggered')
    loadRooms()
  }, [loadRooms])

  if (error) {
    return <RoomListError error={error} onRetry={loadRooms} />
  }

  return (
    <div className="flex h-full flex-col">
      <RoomListHeader
        showHeader={showHeader}
        searchQuery={searchQuery}
        filterType={filterType}
        onSearchChange={setSearchQuery}
        onFilterChange={setFilterType}
        onCreateRoom={handleCreateRoom}
      />

      {/* 房间列表 */}
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
          <RoomListEmpty searchQuery={searchQuery} onRefresh={handleRefresh} />
        ) : (
          <div className="space-y-1 p-2">
            {filteredRooms.map(room => (
              <RoomListItem
                key={room.id}
                room={room}
                isActive={currentRoom?.id === room.id}
                isFavorite={favoriteRooms.has(room.id)}
                onSelect={handleRoomSelect}
                onToggleFavorite={handleToggleFavorite}
                onEdit={handleEditRoom}
                onDelete={handleDeleteRoom}
              />
            ))}
          </div>
        )}
      </div>

      {/* 弹窗 */}
      <CreateRoomDialog open={createModal.open} onOpenChange={createModal.setOpen} />
      {editModal.selectedId != null && (
        <EditRoomDialog
          room={rooms.find(r => r.id === editModal.selectedId) || null}
          open={!!editModal.selectedId}
          onOpenChange={open => !open && editModal.closeModal()}
        />
      )}
      {deleteModal.selectedId != null && (
        <DeleteRoomDialog
          room={rooms.find(r => r.id === deleteModal.selectedId) || null}
          open={!!deleteModal.selectedId}
          onOpenChange={open => !open && deleteModal.closeModal()}
        />
      )}
    </div>
  )
}
