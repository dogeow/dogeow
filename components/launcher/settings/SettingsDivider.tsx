import React from 'react'
import { cn } from '@/lib/helpers'

interface SettingsDividerProps {
  className?: string
}

export function SettingsDivider({ className }: SettingsDividerProps) {
  return <div className={cn('bg-border mx-2 h-px w-full shrink-0', className)}></div>
}
