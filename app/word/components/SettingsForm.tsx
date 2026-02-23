'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useWordSettings, updateWordSettings } from '../hooks/useWord'
import { useWordStore } from '../stores/wordStore'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'sonner'
import { mutate } from 'swr'
import { Check } from 'lucide-react'
import { useAutoSave } from '@/hooks/useAutoSave'

export function SettingsForm() {
  const { data: settings, isLoading } = useWordSettings()
  const { setSettings } = useWordStore()
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    daily_new_words: 10,
    review_multiplier: 2,
    is_auto_pronounce: true,
  })
  const isInitialized = useRef(false)

  const saveSettings = useCallback(
    async (data: typeof formData) => {
      setSaved(false)
      try {
        const result = await updateWordSettings(data)
        if (result.setting) {
          setSettings(result.setting)
          mutate('/word/settings')
          // saved state will be handled by lastSaved effect
        }
      } catch (error) {
        toast.error('保存设置失败')
        console.error('保存设置失败:', error)
      }
    },
    [setSettings]
  )

  const { autoSaving, lastSaved, triggerAutoSave, setInitialData } = useAutoSave<typeof formData>({
    onSave: saveSettings,
    delay: 500,
    initialData: formData,
  })

  useEffect(() => {
    if (settings) {
      const newData = {
        daily_new_words: settings.daily_new_words,
        review_multiplier: settings.review_multiplier,
        is_auto_pronounce: settings.is_auto_pronounce,
      }
      setFormData(newData)
      setSettings(settings)
      isInitialized.current = true
      setInitialData(newData)
    }
  }, [settings, setSettings, setInitialData])

  // trigger auto-save whenever formData changes after initialization
  useEffect(() => {
    if (isInitialized.current) {
      triggerAutoSave()
    }
  }, [formData, triggerAutoSave])

  // show saved indicator when lastSaved updates
  useEffect(() => {
    if (lastSaved) {
      setSaved(true)
      const timer = setTimeout(() => setSaved(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [lastSaved])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">学习设置</CardTitle>
          <div className="text-muted-foreground flex items-center gap-1 text-sm">
            {autoSaving && <LoadingSpinner className="h-3 w-3" />}
            {saved && <Check className="h-3 w-3 text-green-500" />}
            {(autoSaving || saved) && (
              <span className="text-xs">{autoSaving ? '保存中' : '已保存'}</span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="daily_new_words" className="text-sm">
              每日新词
            </Label>
            <Input
              id="daily_new_words"
              type="number"
              min="1"
              max="100"
              value={formData.daily_new_words}
              onChange={e =>
                setFormData(prev => ({ ...prev, daily_new_words: parseInt(e.target.value) || 10 }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="review_multiplier" className="text-sm">
              复习倍数
            </Label>
            <Select
              value={formData.review_multiplier.toString()}
              onValueChange={value =>
                setFormData(prev => ({ ...prev, review_multiplier: parseInt(value) }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1x ({formData.daily_new_words}个)</SelectItem>
                <SelectItem value="2">2x ({formData.daily_new_words * 2}个)</SelectItem>
                <SelectItem value="3">3x ({formData.daily_new_words * 3}个)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between py-2">
          <Label htmlFor="is_auto_pronounce" className="text-sm">
            自动发音
          </Label>
          <Switch
            id="is_auto_pronounce"
            checked={formData.is_auto_pronounce}
            onCheckedChange={checked =>
              setFormData(prev => ({ ...prev, is_auto_pronounce: checked }))
            }
          />
        </div>
      </CardContent>
    </Card>
  )
}
