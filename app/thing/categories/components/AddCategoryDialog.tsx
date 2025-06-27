"use client"

import React, { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { post } from '@/lib/api'
import { API_ENDPOINTS, ERROR_MESSAGES, SUCCESS_MESSAGES, VALIDATION } from '../constants'

interface AddCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCategoryAdded: () => void
}

export default function AddCategoryDialog({ 
  open, 
  onOpenChange,
  onCategoryAdded
}: AddCategoryDialogProps) {
  const [categoryName, setCategoryName] = useState("")
  const [loading, setLoading] = useState(false)

  // 重置表单
  const resetForm = useCallback(() => {
    setCategoryName("")
  }, [])

  // 处理对话框关闭
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen)
      if (!newOpen) {
        resetForm()
      }
    }
  }, [loading, onOpenChange, resetForm])

  // 处理表单提交
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedName = categoryName.trim()
    if (!trimmedName) {
      toast.error(ERROR_MESSAGES.CATEGORY_NAME_EMPTY)
      return
    }

    if (trimmedName.length > VALIDATION.CATEGORY_NAME_MAX_LENGTH) {
      toast.error(ERROR_MESSAGES.CATEGORY_NAME_TOO_LONG)
      return
    }

    setLoading(true)
    try {
      await post(API_ENDPOINTS.CATEGORIES, { name: trimmedName })
      
      toast.success(SUCCESS_MESSAGES.CATEGORY_CREATED)
      resetForm()
      onCategoryAdded()
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : ERROR_MESSAGES.CREATE_FAILED)
    } finally {
      setLoading(false)
    }
  }, [categoryName, resetForm, onCategoryAdded, onOpenChange])

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !loading) {
      handleOpenChange(false)
    }
  }, [loading, handleOpenChange])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>添加分类</DialogTitle>
          <DialogDescription>
            创建一个新的物品分类，以便更好地组织您的物品。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input
                id="categoryName"
                placeholder="输入分类名称"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                disabled={loading}
                autoFocus
                maxLength={VALIDATION.CATEGORY_NAME_MAX_LENGTH}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !categoryName.trim()}
            >
              {loading ? "添加中..." : "添加分类"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 