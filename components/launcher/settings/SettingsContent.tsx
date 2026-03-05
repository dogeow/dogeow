import React, { useCallback } from 'react'
import { BackButton } from '@/components/ui/back-button'
import { MainView } from './MainView'
import { BackgroundView } from './BackgroundView'
import { ThemeView } from './ThemeView'
import { LanguageView } from './LanguageView'
import { SonnerView } from './SonnerView'
import { AppearanceView } from './AppearanceView'
import { SettingsDivider } from './SettingsDivider'
import type { CustomBackground } from '../SettingsPanel'
import type { CustomTheme } from '@/app/types'
import type { ThemeMode, RestPeriod } from '@/stores/themeStore'

type SettingsView = 'main' | 'background' | 'theme' | 'language' | 'sonner' | 'appearance'
type DisplayMode = 'music' | 'apps' | 'settings'

interface SettingsContentProps {
  currentView: SettingsView
  setCurrentView: (view: SettingsView) => void
  toggleDisplayMode: (mode: DisplayMode) => void
  backgroundImage: string
  customBackgrounds: CustomBackground[]
  currentTheme: string
  customThemes: CustomTheme[]
  themeMode: ThemeMode
  restPeriod: RestPeriod
  showProjectCovers: boolean
  handleSetBackground: (url: string) => void
  handleUploadBackground: (e: React.ChangeEvent<HTMLInputElement>) => void
  setCurrentTheme: (theme: string) => void
  setThemeMode: (mode: ThemeMode) => void
  setRestPeriod: (startHour: number, endHour: number) => void
  handleAddCustomTheme: (name: string, color: string) => void
  handleRemoveCustomTheme: (id: string) => void
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
  themeMode,
  restPeriod,
  setRestPeriod,
  showProjectCovers,
  handleSetBackground,
  handleUploadBackground,
  setCurrentTheme,
  setThemeMode,
  handleAddCustomTheme,
  handleRemoveCustomTheme,
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

    case 'appearance':
      return (
        <AppearanceView
          onBack={() => setCurrentView('main')}
          themeMode={themeMode}
          onThemeModeChange={setThemeMode}
          restPeriod={restPeriod}
          onRestPeriodChange={setRestPeriod}
        />
      )

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
            onNavigateToAppearance={() => setCurrentView('appearance')}
            onNavigateToLanguage={() => setCurrentView('language')}
            onNavigateToSonner={() => setCurrentView('sonner')}
            showProjectCovers={showProjectCovers}
            onToggleProjectCovers={handleToggleProjectCovers}
          />
        </>
      )
  }
}
