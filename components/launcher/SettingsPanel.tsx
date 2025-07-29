'use client'

import React from 'react'
import { BackButton } from '@/components/ui/back-button'
import { MainView } from './settings/MainView'
import { BackgroundView } from './settings/BackgroundView'
import { ThemeView } from './settings/ThemeView'
import { LanguageView } from './settings/LanguageView'
import { SettingsDivider } from './settings/SettingsDivider'
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

  const renderCurrentView = () => {
    switch (currentView) {
      case 'background':
        return (
          <BackgroundView
            onBack={() => setCurrentView('main')}
            backgroundImage={backgroundImage}
            onSetBackground={handleSetBackground}
            customBackgrounds={customBackgrounds}
            onUploadBackground={handleUploadBackground}
          />
        )

      case 'theme':
        return (
          <ThemeView
            onBack={() => setCurrentView('main')}
            currentTheme={currentTheme}
            customThemes={customThemes}
            onSetTheme={setCurrentTheme}
            onRemoveTheme={handleRemoveCustomTheme}
            onAddTheme={handleAddCustomTheme}
          />
        )

      case 'language':
        return <LanguageView onBack={() => setCurrentView('main')} />

      default:
        return (
          <>
            {/* 返回按钮 */}
            <BackButton onClick={() => toggleDisplayMode('apps')} className="shrink-0" />

            <SettingsDivider />

            {/* 主视图选项 */}
            <MainView
              onNavigateToBackground={() => setCurrentView('background')}
              onNavigateToTheme={() => setCurrentView('theme')}
              onNavigateToLanguage={() => setCurrentView('language')}
              followSystem={followSystem}
              onToggleFollowSystem={handleToggleFollowSystem}
              showProjectCovers={showProjectCovers}
              onToggleProjectCovers={handleToggleProjectCovers}
            />
          </>
        )
    }
  }

  return (
    <div className="scrollbar-none flex h-full w-full items-center space-x-3 overflow-x-auto">
      {renderCurrentView()}
    </div>
  )
}
