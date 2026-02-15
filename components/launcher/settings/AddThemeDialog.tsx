'use client'

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
      toast.error('Please enter theme name')
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
        <div className="shrink-0">
          <Button
            variant="ghost"
            className={cn(
              'relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-md p-1',
              'bg-primary/10 hover:bg-primary/20 border-primary/30 border-2 border-dashed'
            )}
            title="Add Theme"
          >
            <Plus className="text-primary/70 h-5 w-5" />
          </Button>
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-[80%]">
        <DialogHeader>
          <DialogTitle>Add Theme</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="theme-name" className="w-1/4 text-right">
              Name
            </Label>
            <Input
              id="theme-name"
              value={themeName}
              onChange={e => setThemeName(e.target.value)}
              className="w-3/4"
              placeholder="e.g. My Theme"
            />
          </div>

          <div className="flex items-center gap-4">
            <Label htmlFor="theme-color" className="w-1/4 text-right">
              Color
            </Label>
            <div className="w-3/4">
              <Input
                id="theme-color"
                type="color"
                value={themeColor}
                onChange={e => setThemeColor(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleAddTheme}>Add</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
