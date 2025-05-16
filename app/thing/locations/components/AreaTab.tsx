"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Trash2, X, Check } from "lucide-react"
import { Area } from '../hooks/useLocationManagement'

interface AreaTabProps {
  areas: Area[];
  loading: boolean;
  onAddArea: (name: string) => Promise<boolean | undefined>;
  onUpdateArea: (areaId: number, newName: string) => Promise<boolean | undefined>;
  onDeleteArea: (areaId: number) => void;
}

export default function AreaTab({ areas, loading, onAddArea, onUpdateArea, onDeleteArea }: AreaTabProps) {
  const [editingInlineAreaId, setEditingInlineAreaId] = useState<number | null>(null)
  const [editingAreaName, setEditingAreaName] = useState('')

  const handleUpdateArea = async (areaId: number, newName: string) => {
    const success = await onUpdateArea(areaId, newName);
    if (success) {
      setEditingInlineAreaId(null);
    }
  };

  return (
    <div className="flex flex-col">
      {/* 区域列表 */}
      <div>
        <div>
          {areas.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              暂无区域，请点击右下角的"+"按钮添加区域
            </div>
          ) : (
            <div className="space-y-2">
              {areas.map((area) => (
                <div key={area.id} className="flex items-center justify-between p-2 border rounded-md">
                  {editingInlineAreaId === area.id ? (
                    <div className="flex items-center flex-1 mr-2">
                      <Input
                        value={editingAreaName}
                        onChange={(e) => setEditingAreaName(e.target.value)}
                        className="h-8"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateArea(area.id, editingAreaName);
                          } else if (e.key === 'Escape') {
                            setEditingInlineAreaId(null);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <span>{area.name}</span>
                  )}
                  <div className="flex space-x-2">
                    {editingInlineAreaId === area.id ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setEditingInlineAreaId(null)}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4"/>
                        </Button>
                        <Button 
                          variant="default" 
                          size="icon"
                          onClick={() => handleUpdateArea(area.id, editingAreaName)}
                          className="h-8 w-8"
                        >
                          <Check className="h-4 w-4"/>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setEditingInlineAreaId(area.id);
                            setEditingAreaName(area.name);
                          }}
                        >
                          <Pencil className="h-4 w-4"/>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => onDeleteArea(area.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 