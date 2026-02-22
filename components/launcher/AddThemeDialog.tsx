import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/helpers'
import { Plus } from 'lucide-react'
import { CustomTheme } from '@/app/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { hexToHSL } from '@/lib/helpers/colorUtils'

interface AddThemeDialogProps {
  onAddTheme: (theme: CustomTheme) => void
}

export function AddThemeDialog({ onAddTheme }: AddThemeDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newThemeName, setNewThemeName] = useState('')
  const [newThemeColor, setNewThemeColor] = useState('#3b82f6')

  const handleAddCustomTheme = () => {
    if (!newThemeName.trim()) {
      return
    }

    const hslColor = hexToHSL(newThemeColor)
    const newTheme: CustomTheme = {
      id: `custom-${Date.now()}`,
      name: newThemeName,
      primary: hslColor,
      color: newThemeColor,
    }

    onAddTheme(newTheme)
    setIsDialogOpen(false)
    setNewThemeName('')
    setNewThemeColor('#3b82f6')
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <div className="shrink-0 transition-transform hover:scale-105 active:scale-95">
          <Button
            variant="ghost"
            className={cn(
              'relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-md p-1',
              'bg-primary/10 hover:bg-primary/20 border-primary/30 border-2 border-dashed'
            )}
            title="添加自定义主题"
          >
            <Plus className="text-primary/70 h-5 w-5" />
          </Button>
        </div>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加自定义主题</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="theme-name" className="text-right">
              主题名称
            </Label>
            <Input
              id="theme-name"
              value={newThemeName}
              onChange={e => setNewThemeName(e.target.value)}
              className="col-span-3"
              placeholder="例如：我的主题"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="theme-color" className="text-right">
              主题颜色
            </Label>
            <Input
              id="theme-color"
              type="color"
              value={newThemeColor}
              onChange={e => setNewThemeColor(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleAddCustomTheme}>添加主题</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
