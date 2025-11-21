'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RefreshCw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tag } from '../types'
import { apiRequest } from '@/lib/api'
import { toast } from 'sonner'
import { generateRandomColor } from '@/lib/helpers/colorUtils'

interface CreateTagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTagCreated: (tag: Tag) => void
  initialName?: string
}

// 预定义颜色选项
const COLOR_OPTIONS = [
  '#ef4444', // 红色
  '#f97316', // 橙色
  '#eab308', // 黄色
  '#22c55e', // 绿色
  '#3b82f6', // 蓝色
  '#8b5cf6', // 紫色
  '#ec4899', // 粉色
  '#6b7280', // 灰色
  '#000000', // 黑色
]

const DEFAULT_COLOR = '#3b82f6' // 默认蓝色

const CreateTagDialog: React.FC<CreateTagDialogProps> = ({
  open,
  onOpenChange,
  onTagCreated,
  initialName = '',
}) => {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(initialName)
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [isMobile, setIsMobile] = useState(false)

  // 检测是否为移动设备
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 当initialName变化时更新name状态
  useEffect(() => {
    if (initialName) {
      setName(initialName)
    }
  }, [initialName])

  // 当对话框打开时，生成随机颜色（排除黑色和白色）
  useEffect(() => {
    if (open) {
      let newColor: string
      do {
        newColor = generateRandomColor()
      } while (newColor === '#000000' || newColor === '#ffffff')
      setColor(newColor)
    }
  }, [open])

  // 刷新颜色（排除黑色和白色）
  const refreshColor = () => {
    let newColor: string
    do {
      newColor = generateRandomColor()
    } while (newColor === '#000000' || newColor === '#ffffff')
    setColor(newColor)
  }

  const resetForm = () => {
    setName('')
    setColor(DEFAULT_COLOR)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('请输入标签名称')
      return
    }

    setLoading(true)

    try {
      const tagData = { name: name.trim(), color }
      const response = await apiRequest<Tag>('/things/tags', 'POST', tagData)

      toast.success('标签创建成功')

      // 清空表单
      resetForm()

      // 通知父组件
      onTagCreated(response)

      // 关闭对话框
      onOpenChange(false)
    } catch {
      // API的统一错误处理已经显示了错误提示，这里不需要重复显示
    } finally {
      setLoading(false)
    }
  }

  const ColorButton = ({ colorValue }: { colorValue: string }) => (
    <button
      type="button"
      className={`h-8 w-8 rounded-full transition-all ${
        color === colorValue ? 'ring-primary ring-2 ring-offset-2' : ''
      }`}
      style={{ backgroundColor: colorValue }}
      onClick={() => setColor(colorValue)}
      disabled={loading}
    />
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>创建新标签</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="输入标签名称"
              disabled={loading}
              maxLength={50}
              autoFocus={!isMobile} // 移动端不自动focus，避免弹出键盘
            />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map(option => (
                <ColorButton key={option} colorValue={option} />
              ))}

              <div className="relative h-8">
                <Input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="absolute h-8 w-8 cursor-pointer p-0 opacity-0"
                  disabled={loading}
                />
                <div
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border"
                  style={{ backgroundColor: color }}
                >
                  <span className="text-xs text-white">+</span>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={refreshColor}
                className="h-8 w-8"
                title="生成随机颜色"
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '创建中...' : '创建标签'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateTagDialog
