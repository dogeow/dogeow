import React from 'react'
import { BackButton } from '@/components/ui/back-button'
import { MainView } from './MainView'
import { BackgroundView } from './BackgroundView'
import { ThemeView } from './ThemeView'
import { LanguageView } from './LanguageView'
import { SettingsDivider } from './SettingsDivider'
import type { CustomBackground } from '../SettingsPanel'

type SettingsView = 'main' | 'background' | 'theme' | 'language'
type DisplayMode = 'music' | 'apps' | 'settings'

interface SettingsContentProps {
  currentView: SettingsView
  setCurrentView: (view: SettingsView) => void
  toggleDisplayMode: (mode: DisplayMode) => void
  backgroundImage: string
  customBackgrounds: CustomBackground[]
  currentTheme: string
  customThemes: string[]
  followSystem: boolean
  showProjectCovers: boolean
  handleSetBackground: (url: string) => void
  handleUploadBackground: (file: File) => void
  setCurrentTheme: (theme: string) => void
  handleAddCustomTheme: (theme: string) => void
  handleRemoveCustomTheme: (theme: string) => void
  handleToggleFollowSystem: () => void
  handleToggleProjectCovers: () => void
}

export function SettingsContent({
  currentView,
  setCurrentView,
  toggleDisplayMode,
  backgroundImage,
  customBackgrounds,
  currentTheme,
  customThemes,
  followSystem,
  showProjectCovers,
  handleSetBackground,
  handleUploadBackground,
  setCurrentTheme,
  handleAddCustomTheme,
  handleRemoveCustomTheme,
  handleToggleFollowSystem,
  handleToggleProjectCovers,
}: SettingsContentProps) {
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
