"use client"

import React from 'react'
import { SettingsToggle } from './SettingsToggle'
import { MusicPlayer } from './MusicPlayer'
import { ModeToggle } from './ModeToggle'

export function TopIcons() {
  return (
    <div className="flex items-center gap-2">
      <SettingsToggle />
      <MusicPlayer />
      <ModeToggle />
    </div>
  )
} 