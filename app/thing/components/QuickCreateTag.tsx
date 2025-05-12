"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { toast } from "react-hot-toast"
import { post } from "@/utils/api"

type QuickCreateTagProps = {
  onTagCreated: (tag: any) => void
}

// 生成随机颜色
const getRandomColor = (): string => {
  const colors = [
    "#3b82f6", // 蓝色
    "#ef4444", // 红色
    "#10b981", // 绿色
    "#f59e0b", // 橙色
    "#8b5cf6", // 紫色
    "#ec4899", // 粉色
    "#06b6d4", // 青色
    "#84cc16", // 黄绿色
    "#f43f5e", // 玫红色
    "#6366f1", // 靛蓝色
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export default function QuickCreateTag({ onTagCreated }: QuickCreateTagProps) {
  const [tagName, setTagName] = useState("")
  const [loading, setLoading] = useState(false)
  
  const handleCreate = async () => {
    if (!tagName.trim()) {
      return
    }
    
    setLoading(true)
    try {
      // 随机生成一个颜色
      const color = getRandomColor()
      
      const response = await post("/thing-tags", {
        name: tagName,
        color: color
      })
      
      setTagName("")
      onTagCreated(response)
      toast.success("标签添加成功")
    } catch (error) {
      toast.error("添加标签失败")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagName.trim()) {
      e.preventDefault()
      handleCreate()
    }
  }
  
  return (
    <div className="flex items-center space-x-2">
      <Input 
        value={tagName}
        onChange={(e) => setTagName(e.target.value)}
        placeholder="输入标签名称，按回车创建"
        className="flex-1"
        onKeyDown={handleKeyDown}
      />
      <Button 
        size="sm"
        onClick={handleCreate}
        disabled={loading || !tagName.trim()}
      >
        <Plus className="h-4 w-4 mr-1" />
        添加
      </Button>
    </div>
  )
} 