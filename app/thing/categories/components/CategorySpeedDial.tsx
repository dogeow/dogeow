'use client'

import React, { useState } from 'react'
import { FolderTree, Plus, Shapes, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/helpers'
import AddCategoryDialog from './AddCategoryDialog'

interface CategorySpeedDialProps {
  onCategoryAdded: () => void
  canCreateChild: boolean
}

export default function CategorySpeedDial({
  onCategoryAdded,
  canCreateChild,
}: CategorySpeedDialProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogCategoryType, setDialogCategoryType] = useState<'parent' | 'child'>('parent')

  const speedDialItems = [
    {
      type: 'parent' as const,
      icon: Shapes,
      label: '主分类',
      disabled: false,
    },
    {
      type: 'child' as const,
      icon: FolderTree,
      label: '子分类',
      disabled: !canCreateChild,
    },
  ]

  const handleOpenDialog = (type: 'parent' | 'child') => {
    if (type === 'child' && !canCreateChild) {
      return
    }
    setDialogCategoryType(type)
    setDialogOpen(true)
    setIsOpen(false)
  }

  return (
    <>
      <div className="fixed right-6 bottom-24 z-50">
        <div className="relative">
          <div
            className={cn(
              'absolute right-0 bottom-16 flex flex-col gap-3 transition-all duration-300 ease-out',
              isOpen
                ? 'translate-y-0 scale-100 opacity-100'
                : 'pointer-events-none translate-y-4 scale-95 opacity-0'
            )}
          >
            {speedDialItems.map((item, index) => (
              <div
                key={item.type}
                className={cn(
                  'flex items-center gap-3 transition-all duration-300 ease-out',
                  isOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0',
                  item.disabled && 'opacity-50'
                )}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <span className="text-foreground bg-background/90 rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap shadow-sm backdrop-blur-sm">
                  {item.label}
                </span>
                <Button
                  size="icon"
                  className="h-12 w-12 rounded-full bg-blue-500 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:bg-blue-600 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => handleOpenDialog(item.type)}
                  disabled={item.disabled}
                >
                  <item.icon className="h-5 w-5" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            size="icon"
            className={cn(
              'text-primary-foreground h-14 w-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95',
              isOpen
                ? 'bg-destructive hover:bg-destructive/90 rotate-45'
                : 'bg-primary hover:bg-primary/90 rotate-0'
            )}
            onClick={() => setIsOpen(prev => !prev)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
          </Button>
        </div>

        {isOpen ? (
          <div
            className="fixed inset-0 -z-10 bg-black/20 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          />
        ) : null}
      </div>

      <AddCategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCategoryAdded={onCategoryAdded}
        presetCategoryType={dialogCategoryType}
      />
    </>
  )
}
