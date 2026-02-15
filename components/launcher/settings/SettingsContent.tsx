import React, { useCallback } from 'react'
import { BackButton } from '@/components/ui/back-button'
import { MainView } from './MainView'
import { BackgroundView } from './BackgroundView'
import { ThemeView } from './ThemeView'
import { LanguageView } from './LanguageView'
import { SonnerView } from './SonnerView'
import { SettingsDivider } from './SettingsDivider'
import type { CustomBackground } from '../SettingsPanel'
import type { CustomTheme } from '@/app/types'

type SettingsView = 'main' | 'background' | 'theme' | 'language' | 'sonner'
type DisplayMode = 'music' | 'apps' | 'settings'

interface SettingsContentProps {
  currentView: SettingsView
  setCurrentView: (view: SettingsView) => void
  toggleDisplayMode: (mode: DisplayMode) => void
  backgroundImage: string
  customBackgrounds: CustomBackground[]
  currentTheme: string
  customThemes: CustomTheme[]
  followSystem: boolean
  showProjectCovers: boolean
  handleSetBackground: (url: string) => void
  handleUploadBackground: (e: React.ChangeEvent<HTMLInputElement>) => void
  setCurrentTheme: (theme: string) => void
  handleAddCustomTheme: (name: string, color: string) => void
  handleRemoveCustomTheme: (id: string) => void
  handleToggleFollowSystem: (checked: boolean) => void
  handleToggleProjectCovers: (checked: boolean) => void
  onClose?: () => void
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
  onClose,
}: SettingsContentProps) {
  const handleBack = useCallback(() => {
    if (onClose) {
      onClose()
    } else {
      toggleDisplayMode('apps')
    }
  }, [onClose, toggleDisplayMode])

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

    case 'sonner':
      return <SonnerView onBack={() => setCurrentView('main')} />

    default:
      return (
        <>
          {/* 返回按钮 */}
          <BackButton onClick={handleBack} className="shrink-0" />

          <SettingsDivider />

          {/* 主视图选项 */}
          <MainView
            onNavigateToBackground={() => setCurrentView('background')}
            onNavigateToTheme={() => setCurrentView('theme')}
            onNavigateToLanguage={() => setCurrentView('language')}
            onNavigateToSonner={() => setCurrentView('sonner')}
            followSystem={followSystem}
            onToggleFollowSystem={handleToggleFollowSystem}
            showProjectCovers={showProjectCovers}
            onToggleProjectCovers={handleToggleProjectCovers}
          />
        </>
      )
  }
}
