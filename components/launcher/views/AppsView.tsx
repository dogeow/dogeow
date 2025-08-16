import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { User } from 'lucide-react'
import { AppGrid } from '../AppGrid'
import { SearchBar } from '../SearchBar'
import Logo from '@/public/80.png'
import { useTranslation } from '@/hooks/useTranslation'
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
    handleSearch: (e: React.FormEvent, keepSearchOpen?: boolean) => void
    toggleSearch: () => void
    currentApp: string
    isHomePage: boolean
  }
  isAuthenticated: boolean
  toggleDisplayMode: (mode: DisplayMode) => void
}

export function AppsView({
  router,
  searchManager,
  isAuthenticated,
  toggleDisplayMode,
}: AppsViewProps) {
  const { t } = useTranslation()
  const { clearFilters } = useFilterPersistenceStore()

  // 处理 Logo 点击，清除筛选条件并跳转到首页
  const handleLogoClick = () => {
    // 清除物品管理页面的筛选条件
    clearFilters()
    // 跳转到首页
    router.push('/')
  }

  return (
    <div className="flex h-full items-center justify-between">
      {/* 左侧：应用切换按钮 */}
      <div className="mr-6 flex shrink-0 items-center">
        <Image
          src={Logo}
          alt="apps"
          className="h-10 w-10 cursor-pointer"
          onClick={handleLogoClick}
        />
      </div>

      {/* 中间：应用图标 */}
      {!searchManager.isSearchVisible && (
        <div className="flex flex-1 items-center justify-start">
          <AppGrid toggleDisplayMode={toggleDisplayMode} />
        </div>
      )}

      {/* 右侧：搜索和用户 */}
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

        {/* 用户按钮 */}
        {!(searchManager.isSearchVisible && !searchManager.isHomePage) &&
          (isAuthenticated ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => toggleDisplayMode('auth')}
            >
              <User className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="default"
              className="h-8"
              data-login-trigger
              onClick={() => toggleDisplayMode('auth')}
            >
              {t('auth.login')}
            </Button>
          ))}
      </div>
    </div>
  )
}
