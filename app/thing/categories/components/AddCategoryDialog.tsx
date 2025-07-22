"use client"

import React, { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useItemStore } from '../../stores/itemStore'
import { ERROR_MESSAGES, VALIDATION } from '../constants'

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
  const [categoryType, setCategoryType] = useState<'parent' | 'child'>('parent')
  const [selectedParentId, setSelectedParentId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  
  const { categories, createCategory } = useItemStore()
  
  // 获取主分类列表
  const parentCategories = categories.filter(cat => !cat.parent_id)

  // 重置表单
  const resetForm = useCallback(() => {
    setCategoryName("")
    setCategoryType('parent')
    setSelectedParentId('')
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

    // 如果是子分类，检查是否选择了父分类
    if (categoryType === 'child' && !selectedParentId) {
      toast.error("请选择父分类")
      return
    }

    setLoading(true)
    try {
      const categoryData = {
        name: trimmedName,
        parent_id: categoryType === 'child' ? Number(selectedParentId) : null
      }
      
      await createCategory(categoryData)
      
      const successMessage = categoryType === 'parent' 
        ? `已创建主分类 "${trimmedName}"` 
        : `已创建子分类 "${trimmedName}"`
      
      toast.success(successMessage)
      resetForm()
      onCategoryAdded()
      onOpenChange(false)
    } catch (error) {
      console.error("创建分类失败:", error)
      toast.error("创建分类失败：" + (error instanceof Error ? error.message : "未知错误"))
    } finally {
      setLoading(false)
    }
  }, [categoryName, categoryType, selectedParentId, createCategory, resetForm, onCategoryAdded, onOpenChange])

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
              <Label htmlFor="categoryType">分类类型</Label>
              <Select
                value={categoryType}
                onValueChange={(value: 'parent' | 'child') => {
                  setCategoryType(value)
                  if (value === 'parent') {
                    setSelectedParentId('')
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择分类类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">主分类</SelectItem>
                  <SelectItem value="child">子分类</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {categoryType === 'child' && (
              <div className="grid gap-2">
                <Label htmlFor="parentCategory">父分类</Label>
                <Select
                  value={selectedParentId}
                  onValueChange={setSelectedParentId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择父分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {parentCategories.map((parent) => (
                      <SelectItem key={parent.id} value={parent.id.toString()}>
                        {parent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="categoryName">分类名称</Label>
              <Input
                id="categoryName"
                placeholder={categoryType === 'parent' ? "输入主分类名称" : "输入子分类名称"}
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
              disabled={loading || !categoryName.trim() || (categoryType === 'child' && !selectedParentId)}
            >
              {loading ? "创建中..." : `创建${categoryType === 'parent' ? '主分类' : '子分类'}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 