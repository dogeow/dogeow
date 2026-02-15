'use client'

import React from 'react'
import { BackButton } from '@/components/ui/back-button'
import { SettingsDivider } from './SettingsDivider'
import { useToastStore, ToastPosition } from '@/stores/toastStore'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const positionOptions: { value: ToastPosition; label: string }[] = [
  { value: 'top-left', label: '左上' },
  { value: 'top-center', label: '顶部中间' },
  { value: 'top-right', label: '右上' },
  { value: 'bottom-left', label: '左下' },
  { value: 'bottom-center', label: '底部中间' },
  { value: 'bottom-right', label: '右下' },
]

interface SonnerViewProps {
  onBack: () => void
}

export function SonnerView({ onBack }: SonnerViewProps) {
  const { position, setPosition, duration, setDuration } = useToastStore()

  return (
    <>
      <BackButton onClick={onBack} className="shrink-0" />
      <SettingsDivider />
      <div className="flex w-full flex-col gap-4 px-3">
        <div className="text-sm font-medium">提示位置</div>
        <RadioGroup
          value={position}
          onValueChange={value => setPosition(value as ToastPosition)}
          className="flex flex-wrap gap-2"
        >
          {positionOptions.map(option => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={option.value} />
              <Label htmlFor={option.value} className="cursor-pointer text-xs">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      <SettingsDivider />
      <div className="flex w-full flex-col gap-4 px-3">
        <div className="text-sm font-medium">提示时长</div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="1000"
            max="10000"
            step="500"
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-muted-foreground text-xs">{duration / 1000}秒</span>
        </div>
      </div>
    </>
  )
}
