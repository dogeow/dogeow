'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { isLightColor, generateRandomColor } from '@/lib/helpers/colorUtils'
import { RefreshCw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { post } from '@/lib/api'
import { mutate } from 'swr'

interface AddTagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AddTagDialog({ open, onOpenChange }: AddTagDialogProps) {
  const [tagName, setTagName] = useState('')
  const [tagColor, setTagColor] = useState('#3b82f6') // 默认蓝色
  const [loading, setLoading] = useState(false)
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

  // 当对话框打开时，生成随机颜色
  useEffect(() => {
    if (open) {
      setTagColor(generateRandomColor())
    }
  }, [open])

  // 刷新颜色
  const refreshColor = () => {
    setTagColor(generateRandomColor())
  }

  // 生成标签样式
  const getTagStyle = (color: string = '#3b82f6') => {
    return {
      backgroundColor: color,
      color: isLightColor(color) ? '#000' : '#fff',
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!tagName.trim()) {
      toast.error('标签名称不能为空')
      return
    }

    setLoading(true)
    try {
      await post('/notes/tags', {
        name: tagName.trim(),
        color: tagColor,
      })

      toast.success('标签创建成功')
      setTagName('')
      setTagColor('#3b82f6')
      mutate('/notes/tags') // 刷新标签列表
      onOpenChange(false)
    } catch {
      // API的统一错误处理已经显示了错误提示，这里不需要重复显示
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加新标签</DialogTitle>
          <DialogDescription>创建一个新的标签，标签可用于分类和搜索笔记。</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">标签名称</label>
              <Input
                id="tagName"
                placeholder="输入标签名称"
                value={tagName}
                onChange={e => setTagName(e.target.value)}
                autoFocus={!isMobile} // 移动端不自动focus，避免弹出键盘
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">标签颜色</label>
              <div className="flex items-center space-x-2">
                <Input
                  type="color"
                  value={tagColor}
                  onChange={e => setTagColor(e.target.value)}
                  className="h-10 w-12 p-1"
                />
                <Input
                  value={tagColor}
                  onChange={e => setTagColor(e.target.value)}
                  placeholder="#RRGGBB"
                  className="w-32"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={refreshColor}
                  className="h-10 w-10"
                  title="生成随机颜色"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Badge style={getTagStyle(tagColor)} className="ml-2 h-6 px-2">
                  {tagName || '预览'}
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading || !tagName.trim()}>
              {loading ? '添加中...' : '添加标签'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
