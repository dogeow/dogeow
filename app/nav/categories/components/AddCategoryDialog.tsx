'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useNavStore } from '@/app/nav/stores/navStore'

interface AddCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCategoryAdded: () => void
}

export default function AddCategoryDialog({
  open,
  onOpenChange,
  onCategoryAdded,
}: AddCategoryDialogProps) {
  const [categoryName, setCategoryName] = useState('')
  const [categoryDescription, setCategoryDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { createCategory } = useNavStore()

  // 检测是否为移动设备
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!categoryName.trim()) {
      toast.error('分类名称不能为空')
      return
    }

    setLoading(true)
    try {
      await createCategory({
        name: categoryName,
        description: categoryDescription || null,
        is_visible: true,
        sort_order: 0,
      })

      toast.success('分类创建成功')
      setCategoryName('')
      setCategoryDescription('')
      onCategoryAdded()
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '发生错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加分类</DialogTitle>
          <DialogDescription>创建一个新的导航分类，以便更好地组织您的网站导航。</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input
                id="categoryName"
                placeholder="输入分类名称"
                value={categoryName}
                onChange={e => setCategoryName(e.target.value)}
                autoFocus={!isMobile} // 移动端不自动focus，避免弹出键盘
              />
            </div>
            <div className="grid gap-2">
              <Textarea
                id="categoryDescription"
                placeholder="输入分类描述（可选）"
                value={categoryDescription}
                onChange={e => setCategoryDescription(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '添加中...' : '添加分类'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
