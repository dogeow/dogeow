"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/helpers'
import { toast } from 'sonner'

interface AddThemeDialogProps {
  onAddTheme: (name: string, color: string) => void
}

export function AddThemeDialog({ onAddTheme }: AddThemeDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [themeName, setThemeName] = useState('')
  const [themeColor, setThemeColor] = useState('#3b82f6')

  const handleAddTheme = () => {
    if (!themeName.trim()) {
      toast.error("请输入主题名称")
      return
    }
    
    onAddTheme(themeName, themeColor)
    setIsOpen(false)
    setThemeName('')
    setThemeColor('#3b82f6')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="shrink-0">
          <Button 
            variant="ghost"
            className={cn(
              "p-1 h-9 w-9 rounded-md overflow-hidden relative flex items-center justify-center",
              "bg-primary/10 hover:bg-primary/20 border-2 border-dashed border-primary/30"
            )}
            title="添加自定义主题"
          >
            <Plus className="h-5 w-5 text-primary/70" />
          </Button>
        </motion.div>
      </DialogTrigger>
      
      <DialogContent className="max-w-[80%]">
        <DialogHeader>
          <DialogTitle>添加自定义主题</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="theme-name" className="w-1/4 text-right">
              主题名称
            </Label>
            <Input
              id="theme-name"
              value={themeName}
              onChange={(e) => setThemeName(e.target.value)}
              className="w-3/4"
              placeholder="例如：我的主题"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <Label htmlFor="theme-color" className="w-1/4 text-right">
              主题颜色
            </Label>
            <div className="w-3/4">
              <Input
                id="theme-color"
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button onClick={handleAddTheme}>添加主题</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 