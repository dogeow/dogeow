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
import { Switch } from '@/components/ui/switch'
import useChatStore from '@/app/chat/chatStore'
import { useTranslation } from '@/hooks/useTranslation'
import { calculateCharLength } from '@/lib/helpers'
import type { CreateRoomData } from '../types'

// 房间名称长度限制（按字符数计算：中文/emoji算2，数字/字母算1）
const MIN_ROOM_NAME_LENGTH = 2 // 最少2个字符
const MAX_ROOM_NAME_LENGTH = 20 // 最多20个字符

// 创建房间表单校验 schema
const createRoomSchema = z.object({
  name: z
    .string()
    .min(1, '房间名称是必需的')
    .refine(
      val => calculateCharLength(val) >= MIN_ROOM_NAME_LENGTH,
      `房间名称至少需要${MIN_ROOM_NAME_LENGTH}个字符`
    )
    .refine(
      val => calculateCharLength(val) <= MAX_ROOM_NAME_LENGTH,
      `房间名称不能超过${MAX_ROOM_NAME_LENGTH}个字符（中文/emoji算2个字符，数字/字母算1个字符）`
    ),
  description: z.string().max(200, '描述不能超过200个字符').optional(),
  is_private: z.boolean().optional().default(false),
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
      is_private: false,
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
          is_private: data.is_private ?? false,
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
              render={({ field }) => {
                // 使用字符长度计算函数（中文/emoji算2，数字/字母算1）
                const charCount = calculateCharLength(field.value || '')
                return (
                  <FormItem>
                    <FormLabel>{t('chat.room_name', '房间名称')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder={t('chat.room_name_placeholder', '例如：一般讨论')}
                          disabled={isSubmitting}
                          autoFocus
                          className="pr-12"
                          {...field}
                        />
                        <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-xs">
                          {charCount}/{MAX_ROOM_NAME_LENGTH}
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )
              }}
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
            <FormField
              control={form.control}
              name="is_private"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {t('chat.private_room', '私有房间')}
                    </FormLabel>
                    <p className="text-muted-foreground text-sm">
                      {t('chat.private_room_hint', '仅成员可见，其他人无法加入')}
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
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
