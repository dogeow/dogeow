'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pencil, Trash2, X, Check, Star } from 'lucide-react'
import { Area } from '../hooks/useLocationManagement'
import { useTranslation } from '@/hooks/useTranslation'

interface AreaTabProps {
  areas: Area[]
  loading: boolean
  onAddArea: (name: string) => Promise<boolean | undefined>
  onUpdateArea: (areaId: number, newName: string) => Promise<boolean | undefined>
  onDeleteArea: (areaId: number) => void
  onSetDefaultArea: (areaId: number) => Promise<boolean | undefined>
}

export default function AreaTab({
  areas,
  loading,
  onUpdateArea,
  onDeleteArea,
  onSetDefaultArea,
}: AreaTabProps) {
  const { t } = useTranslation()
  const [editingInlineAreaId, setEditingInlineAreaId] = useState<number | null>(null)
  const [editingAreaName, setEditingAreaName] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  // 检测是否为移动设备
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
        autoFocus={!isMobile} // 移动端不自动focus，避免弹出键盘
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
      <Button
        variant="outline"
        size="icon"
        onClick={cancelEditing}
        className="h-8 w-8"
        disabled={loading}
        aria-label={t('common.cancel')}
      >
        <X className="h-4 w-4" />
      </Button>
      <Button
        variant="default"
        size="icon"
        onClick={() => handleUpdateArea(area.id, editingAreaName)}
        className="h-8 w-8"
        disabled={loading || !editingAreaName.trim()}
        aria-label={t('common.save')}
      >
        <Check className="h-4 w-4" />
      </Button>
    </>
  )

  const renderViewActions = (area: Area) => (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onSetDefaultArea(area.id)}
        disabled={loading}
        className={
          area.is_default ? 'text-yellow-500' : 'text-muted-foreground hover:text-yellow-500'
        }
        title={area.is_default ? t('location.current_default_area') : t('location.set_as_default')}
        aria-label={
          area.is_default ? t('location.current_default_area') : t('location.set_as_default')
        }
      >
        <Star className={`h-4 w-4 ${area.is_default ? 'fill-current' : ''}`} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => startEditing(area)}
        disabled={loading}
        aria-label={t('common.edit')}
        title={t('common.edit')}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDeleteArea(area.id)}
        disabled={loading}
        aria-label={t('common.delete')}
        title={t('common.delete')}
      >
        <Trash2 className="text-destructive h-4 w-4" />
      </Button>
    </>
  )

  return (
    <div className="flex flex-col">
      {/* 区域列表 */}
      <div>
        {areas.length === 0 ? (
          <div className="text-muted-foreground py-4 text-center">{t('location.no_areas')}</div>
        ) : (
          <div className="space-y-2">
            {areas.map(area => (
              <div
                key={area.id}
                className="flex items-center justify-between rounded-md border p-2"
                aria-label={area.is_default ? t('location.current_default_area') : undefined}
              >
                {editingInlineAreaId === area.id ? (
                  renderEditMode(area)
                ) : (
                  <span className={area.is_default ? 'font-semibold' : ''}>{area.name}</span>
                )}
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
