"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tag } from '../types'
import { apiRequest } from '@/utils/api'
import { toast } from 'sonner'

interface CreateTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTagCreated: (tag: Tag) => void;
}

const CreateTagDialog: React.FC<CreateTagDialogProps> = ({ 
  open, 
  onOpenChange,
  onTagCreated 
}) => {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#3b82f6') // 默认蓝色
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('请输入标签名称')
      return
    }
    
    setLoading(true)
    
    try {
      const tagData = { name: name.trim(), color }
      const response = await apiRequest<Tag>('/tags', 'POST', tagData)
      
      toast.success('标签创建成功')
      
      // 清空表单
      setName('')
      setColor('#3b82f6')
      
      // 通知父组件
      onTagCreated(response)
      
      // 关闭对话框
      onOpenChange(false)
    } catch (error) {
      console.error('创建标签失败:', error)
      toast.error(error instanceof Error ? error.message : '创建标签失败，请重试')
    } finally {
      setLoading(false)
    }
  }
  
  // 预定义颜色选项
  const colorOptions = [
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>创建新标签</DialogTitle>
          <DialogDescription>
            创建一个新的标签来分类你的物品
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">标签名称</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入标签名称"
              disabled={loading}
              maxLength={50}
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label>标签颜色</Label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`h-8 w-8 rounded-full transition-all ${
                    color === option ? 'ring-2 ring-offset-2 ring-primary' : ''
                  }`}
                  style={{ backgroundColor: option }}
                  onClick={() => setColor(option)}
                  disabled={loading}
                />
              ))}
              
              <div className="relative h-8">
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute opacity-0 w-8 h-8 p-0 cursor-pointer"
                  disabled={loading}
                />
                <div 
                  className="h-8 w-8 rounded-full border cursor-pointer flex items-center justify-center"
                  style={{ backgroundColor: color }}
                >
                  <span className="text-xs text-white">+</span>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="mt-4">
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