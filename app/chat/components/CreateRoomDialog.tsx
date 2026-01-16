'use client'

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import useChatStore from '@/app/chat/chatStore'
import { useTranslation } from '@/hooks/useTranslation'
import type { CreateRoomData } from '../types'

// 创建房间表单校验 schema
const createRoomSchema = z.object({
  name: z
    .string()
    .min(1, '房间名称是必需的')
    .min(3, '房间名称至少需要3个字符')
    .max(50, '房间名称不能超过50个字符')
    .regex(
      /^[\u4e00-\u9fa5a-zA-Z0-9\s\-_]+$/,
      '房间名称只能包含中文、字母、数字、空格、连字符和下划线'
    ),
  description: z.string().max(200, '描述不能超过200个字符').optional(),
})

type CreateRoomFormData = z.infer<typeof createRoomSchema>

interface CreateRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateRoomDialog({ open, onOpenChange }: CreateRoomDialogProps) {
  const { t } = useTranslation()
  const { createRoom, setCurrentRoom, joinRoom } = useChatStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 初始化表单
  const form = useForm<CreateRoomFormData>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  // 提交表单
  const onSubmit = useCallback(
    async (data: CreateRoomFormData) => {
      setIsSubmitting(true)
      try {
        const roomData: CreateRoomData = {
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
        }
        const newRoom = await createRoom(roomData)
        // 自动加入并设置当前房间
        await joinRoom(newRoom.id)
        setCurrentRoom(newRoom)
        // 重置表单并关闭弹窗
        form.reset()
        onOpenChange(false)
      } catch (error) {
        console.error('Failed to create room:', error)
        // 错误已由 store 处理并在 UI 显示
      } finally {
        setIsSubmitting(false)
      }
    },
    [createRoom, joinRoom, setCurrentRoom, form, onOpenChange]
  )

  // 控制弹窗开关及表单重置
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!isSubmitting) {
        onOpenChange(newOpen)
        if (!newOpen) {
          form.reset()
        }
      }
    },
    [isSubmitting, onOpenChange, form]
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('chat.create_new_room', '创建新聊天房间')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('chat.room_name', '房间名称')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('chat.room_name_placeholder', '例如：一般讨论')}
                      disabled={isSubmitting}
                      autoFocus
                      maxLength={50}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('chat.description_optional', '描述（可选）')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('chat.description_placeholder', '描述这个房间的用途...')}
                      className="min-h-[80px]"
                      disabled={isSubmitting}
                      maxLength={200}
                      {...field}
                    />
                  </FormControl>
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
                {t('common.cancel', '取消')}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="relative">
                {isSubmitting && <Loader2 className="absolute left-4 h-4 w-4 animate-spin" />}
                {t('chat.create_room', '创建房间')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
