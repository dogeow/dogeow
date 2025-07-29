'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import useChatStore from '@/app/chat/chatStore'
import type { ChatRoom } from '../types'

interface DeleteRoomDialogProps {
  room: ChatRoom
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteRoomDialog({ room, open, onOpenChange }: DeleteRoomDialogProps) {
  const { rooms, setRooms, currentRoom, setCurrentRoom } = useChatStore()
  const [confirmationText, setConfirmationText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isConfirmed = confirmationText === room.name
  const hasOnlineUsers = (room.online_count || 0) > 0

  const handleDelete = async () => {
    if (!isConfirmed) return

    setIsDeleting(true)
    setError(null)

    try {
      // In a real app, this would make an API call to delete the room
      // For now, we'll simulate the deletion
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Remove room from store
      const updatedRooms = rooms.filter(r => r.id !== room.id)
      setRooms(updatedRooms)

      // If this was the current room, clear it
      if (currentRoom?.id === room.id) {
        setCurrentRoom(null)
      }

      // Close dialog
      onOpenChange(false)
      setConfirmationText('')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete room')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    if (!isDeleting) {
      onOpenChange(false)
      setConfirmationText('')
      setError(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Delete Room
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the room and all its
            messages.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {hasOnlineUsers && (
            <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p className="text-sm">
                This room currently has {room.online_count} online user(s). Deleting it will
                disconnect all users.
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Type <strong>{room.name}</strong> to confirm deletion:
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={e => setConfirmationText(e.target.value)}
              placeholder={room.name}
              disabled={isDeleting}
            />
          </div>

          <div className="bg-muted rounded-lg p-3">
            <h4 className="font-medium">Room Details</h4>
            <div className="text-muted-foreground mt-2 space-y-1 text-sm">
              <p>Name: {room.name}</p>
              {room.description && <p>Description: {room.description}</p>}
              <p>Created: {new Date(room.created_at).toLocaleDateString()}</p>
              <p>Online Users: {room.online_count || 0}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
          >
            {isDeleting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Room
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
