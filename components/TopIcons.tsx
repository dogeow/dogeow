"use client"

import React from 'react'
import { SettingsToggle } from './SettingsToggle'
import { ModeToggle } from './ModeToggle'

export function TopIcons() {
  return (
    <div className="flex items-center gap-2">
      <SettingsToggle />
      <ModeToggle />
    </div>
  )
} 