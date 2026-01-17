'use client'

import React from 'react'
import { SettingsContent } from './settings/SettingsContent'
import { useSettingsPanel } from './settings/useSettingsPanel'

type DisplayMode = 'music' | 'apps' | 'settings'

export interface CustomBackground {
  id: string
  name: string
  url: string
}

interface SettingsPanelProps {
  toggleDisplayMode: (mode: DisplayMode) => void
  backgroundImage: string
  setBackgroundImage: (url: string) => void
  customBackgrounds: CustomBackground[]
  setCustomBackgrounds: React.Dispatch<React.SetStateAction<CustomBackground[]>>
}

export function SettingsPanel({
  toggleDisplayMode,
  backgroundImage,
  setBackgroundImage,
  customBackgrounds,
  setCustomBackgrounds,
}: SettingsPanelProps) {
  const {
    currentView,
    currentTheme,
    customThemes,
    followSystem,
    showProjectCovers,
    setCurrentView,
    handleSetBackground,
    handleUploadBackground,
    setCurrentTheme,
    handleAddCustomTheme,
    handleRemoveCustomTheme,
    handleToggleFollowSystem,
    handleToggleProjectCovers,
  } = useSettingsPanel({
    backgroundImage,
    setBackgroundImage,
    customBackgrounds,
    setCustomBackgrounds,
  })

  return (
    <div className="scrollbar-none flex h-full w-full items-center space-x-3 overflow-x-auto">
      <SettingsContent
        currentView={currentView}
        setCurrentView={setCurrentView}
        toggleDisplayMode={toggleDisplayMode}
        backgroundImage={backgroundImage}
        customBackgrounds={customBackgrounds}
        currentTheme={currentTheme}
        customThemes={customThemes}
        followSystem={followSystem}
        showProjectCovers={showProjectCovers}
        handleSetBackground={handleSetBackground}
        handleUploadBackground={handleUploadBackground}
        setCurrentTheme={setCurrentTheme}
        handleAddCustomTheme={handleAddCustomTheme}
        handleRemoveCustomTheme={handleRemoveCustomTheme}
        handleToggleFollowSystem={handleToggleFollowSystem}
        handleToggleProjectCovers={handleToggleProjectCovers}
      />
    </div>
  )
}
