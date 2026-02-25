'use client'

import React from 'react'
import { AppGrid } from '../AppGrid'
import { SearchBar } from '../SearchBar'
import { LogoButton } from '../common/LogoButton'
import { UserButton } from './UserButton'
import { NotificationDropdown } from '@/components/app/NotificationDropdown'
import { useFilterPersistenceStore } from '@/app/thing/stores/filterPersistenceStore'

type DisplayMode = 'music' | 'apps' | 'settings' | 'auth' | 'search-result'

interface AppsViewProps {
  router: {
    push: (path: string) => void
  }
  searchManager: {
    isSearchVisible: boolean
    searchTerm: string
    setSearchTerm: (term: string) => void
    handleSearch: (e: React.SyntheticEvent, keepSearchOpen?: boolean) => void
    toggleSearch: () => void
    currentApp: string
    isHomePage: boolean
  }
  isAuthenticated: boolean
  toggleDisplayMode: (mode: DisplayMode) => void
  onOpenAi?: () => void
}

export function AppsView({
  router,
  searchManager,
  isAuthenticated,
  toggleDisplayMode,
  onOpenAi,
}: AppsViewProps) {
  const { clearFilters } = useFilterPersistenceStore()

  const handleLogoClick = () => {
    clearFilters()
    router.push('/')
  }

  return (
    <div className="flex h-full items-center justify-between">
      {/* 左侧：应用切换按钮 */}
      <div className="mr-6 flex shrink-0 items-center">
        <LogoButton onClick={handleLogoClick} />
      </div>

      {/* 中间：应用图标 */}
      {!searchManager.isSearchVisible && (
        <div className="flex flex-1 items-center justify-start">
          <AppGrid toggleDisplayMode={toggleDisplayMode} onOpenAi={onOpenAi} />
        </div>
      )}

      {/* 右侧：搜索、通知、用户 */}
      <div
        className={`flex items-center gap-3 ${searchManager.isSearchVisible ? 'flex-1 justify-between' : 'ml-auto'}`}
      >
        <SearchBar
          isVisible={searchManager.isSearchVisible}
          searchTerm={searchManager.searchTerm}
          setSearchTerm={searchManager.setSearchTerm}
          onSearch={searchManager.handleSearch}
          onToggleSearch={searchManager.toggleSearch}
          currentApp={searchManager.currentApp}
        />

        {/* 通知铃铛 */}
        {!(searchManager.isSearchVisible && !searchManager.isHomePage) && <NotificationDropdown />}

        {/* 用户按钮 */}
        {!(searchManager.isSearchVisible && !searchManager.isHomePage) && (
          <UserButton
            isAuthenticated={isAuthenticated}
            onToggleAuth={() => toggleDisplayMode('auth')}
          />
        )}
      </div>
    </div>
  )
}
