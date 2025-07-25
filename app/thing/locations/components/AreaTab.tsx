'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pencil, Trash2, X, Check } from 'lucide-react'
import { Area } from '../hooks/useLocationManagement'

interface AreaTabProps {
  areas: Area[]
  loading: boolean
  onAddArea: (name: string) => Promise<boolean | undefined>
  onUpdateArea: (areaId: number, newName: string) => Promise<boolean | undefined>
  onDeleteArea: (areaId: number) => void
}

export default function AreaTab({ areas, onUpdateArea, onDeleteArea }: AreaTabProps) {
  const [editingInlineAreaId, setEditingInlineAreaId] = useState<number | null>(null)
  const [editingAreaName, setEditingAreaName] = useState('')

  const handleUpdateArea = async (areaId: number, newName: string) => {
    if (!newName.trim()) return

    const success = await onUpdateArea(areaId, newName)
    if (success) {
      setEditingInlineAreaId(null)
    }
  }

  const startEditing = (area: Area) => {
    setEditingInlineAreaId(area.id)
    setEditingAreaName(area.name)
  }

  const cancelEditing = () => {
    setEditingInlineAreaId(null)
  }

  const renderEditMode = (area: Area) => (
    <div className="mr-2 flex flex-1 items-center">
      <Input
        value={editingAreaName}
        onChange={e => setEditingAreaName(e.target.value)}
        className="h-8"
        autoFocus
        onKeyDown={e => {
          if (e.key === 'Enter') {
            handleUpdateArea(area.id, editingAreaName)
          } else if (e.key === 'Escape') {
            cancelEditing()
          }
        }}
      />
    </div>
  )

  const renderEditActions = (area: Area) => (
    <>
      <Button variant="outline" size="icon" onClick={cancelEditing} className="h-8 w-8">
        <X className="h-4 w-4" />
      </Button>
      <Button
        variant="default"
        size="icon"
        onClick={() => handleUpdateArea(area.id, editingAreaName)}
        className="h-8 w-8"
      >
        <Check className="h-4 w-4" />
      </Button>
    </>
  )

  const renderViewActions = (area: Area) => (
    <>
      <Button variant="ghost" size="icon" onClick={() => startEditing(area)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => onDeleteArea(area.id)}>
        <Trash2 className="text-destructive h-4 w-4" />
      </Button>
    </>
  )

  return (
    <div className="flex flex-col">
      {/* 区域列表 */}
      <div>
        {areas.length === 0 ? (
          <div className="text-muted-foreground py-4 text-center">
            暂无区域，请点击右下角的&quot;+&quot;按钮添加区域
          </div>
        ) : (
          <div className="space-y-2">
            {areas.map(area => (
              <div
                key={area.id}
                className="flex items-center justify-between rounded-md border p-2"
              >
                {editingInlineAreaId === area.id ? renderEditMode(area) : <span>{area.name}</span>}
                <div className="flex space-x-2">
                  {editingInlineAreaId === area.id
                    ? renderEditActions(area)
                    : renderViewActions(area)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
