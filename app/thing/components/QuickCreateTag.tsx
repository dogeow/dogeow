"use client"

import React, { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { Tag } from '../types'
import { apiRequest } from '@/utils/api'

interface QuickCreateTagProps {
  onTagCreated: (tag: Tag) => void;
}

const QuickCreateTag: React.FC<QuickCreateTagProps> = ({ onTagCreated }) => {
  const [tagName, setTagName] = useState('')
  const [loading, setLoading] = useState(false)
  
  // 随机生成颜色
  const getRandomColor = () => {
    const colors = [
      '#ef4444', // 红色
      '#f97316', // 橙色
      '#eab308', // 黄色
      '#22c55e', // 绿色
      '#3b82f6', // 蓝色
      '#8b5cf6', // 紫色
      '#ec4899', // 粉色
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }
  
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!tagName.trim()) {
      toast.error('请输入标签名称')
      return
    }
    
    setLoading(true)
    
    try {
      const tagData = { 
        name: tagName.trim(), 
        color: getRandomColor() 
      }
      
      const response = await apiRequest<Tag>('/tags', 'POST', tagData)
      
      toast.success('标签创建成功')
      onTagCreated(response)
      setTagName('')
    } catch (error) {
      console.error('创建标签失败:', error)
      toast.error(error instanceof Error ? error.message : '创建标签失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleCreateTag} className="flex gap-2">
      <Input
        placeholder="输入标签名称"
        value={tagName}
        onChange={(e) => setTagName(e.target.value)}
        disabled={loading}
        className="h-8 text-sm"
      />
      <Button 
        type="submit" 
        size="sm" 
        disabled={loading || !tagName.trim()}
        className="h-8"
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        添加
      </Button>
    </form>
  )
}

export default QuickCreateTag 