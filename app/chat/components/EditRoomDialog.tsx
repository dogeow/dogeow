'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { put } from '@/lib/api'
import useChatStore from '@/app/chat/chatStore'
import type { ChatRoom } from '../types'
import { useTranslation } from '@/hooks/useTranslation'

const editRoomSchema = z.object({
  name: z
    .string()
    .min(1, 'Room name is required')
    .min(3, 'Room name must be at least 3 characters')
    .max(50, 'Room name must be less than 50 characters')
    .regex(
      /^[a-zA-Z0-9\s\-_]+$/,
      'Room name can only contain letters, numbers, spaces, hyphens, and underscores'
    ),
  description: z.string().max(200, 'Description must be less than 200 characters').optional(),
})

type EditRoomFormData = z.infer<typeof editRoomSchema>

interface EditRoomDialogProps {
  room: ChatRoom
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditRoomDialog({ room, open, onOpenChange }: EditRoomDialogProps) {
  const { t } = useTranslation()
  const { loadRooms } = useChatStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<EditRoomFormData>({
    resolver: zodResolver(editRoomSchema),
    defaultValues: {
      name: room.name,
      description: room.description || '',
    },
  })

  // Reset form when room changes
  useEffect(() => {
    form.reset({
      name: room.name,
      description: room.description || '',
    })
  }, [room, form])

  const onSubmit = async (data: EditRoomFormData) => {
    setIsSubmitting(true)

    try {
      await put(`/chat/rooms/${room.id}`, {
        name: data.name.trim(),
        description: data.description?.trim() || null,
      })

      // Reload rooms to get updated data
      await loadRooms()

      // Close dialog
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to update room:', error)
      // Error is handled by the API helper and will be displayed as a toast
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen)
      if (!newOpen) {
        form.reset()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('chat.edit_room', '编辑聊天房间')}</DialogTitle>
          <DialogDescription>
            {t('chat.edit_room_description', '更新房间名称和描述。更改将显示给所有成员。')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., General Discussion"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('chat.room_name_description', '一个独特的聊天房间名称（3-50个字符）')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what this room is for..."
                      className="min-h-[80px]"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t(
                      'chat.room_description_description',
                      '帮助其他人理解这个房间的用途（最多200个字符）'
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Update Room
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
