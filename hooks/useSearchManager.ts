import { useState, useEffect, useMemo, useCallback } from 'react'

export const useSearchManager = (pathname: string) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearchVisible, setIsSearchVisible] = useState(false)
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)
  const [searchText, setSearchText] = useState<string>('')

  const isHomePage = useMemo(() => pathname === '/', [pathname])
  const currentApp = useMemo(() => pathname.split('/')[1], [pathname])

  const handleSearch = useCallback(
    (e: React.FormEvent, keepSearchOpen: boolean = false) => {
      e.preventDefault()
      if (!searchTerm.trim()) return

      if (isHomePage) {
        setIsSearchDialogOpen(true)
      } else {
        const searchEvent = new CustomEvent(`${currentApp}-search`, {
          detail: { searchTerm },
        })
        document.dispatchEvent(searchEvent)
      }

      if (!keepSearchOpen) {
        setIsSearchVisible(false)
      }
    },
    [searchTerm, isHomePage, currentApp]
  )

  const toggleSearch = useCallback(() => {
    if (isSearchVisible) {
      setIsSearchVisible(false)
    } else if (isHomePage) {
      setIsSearchDialogOpen(true)
      setIsSearchVisible(false)
    } else {
      setIsSearchVisible(true)
    }
  }, [isSearchVisible, isHomePage])

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyboardShortcuts = (e: KeyboardEvent) => {
      if (!((e.ctrlKey || e.metaKey) && e.key === 'k')) return

      e.preventDefault()

      if (isSearchDialogOpen) {
        setIsSearchDialogOpen(false)
      } else if (isSearchVisible) {
        setIsSearchVisible(false)
      } else {
        void (isHomePage ? setIsSearchDialogOpen(true) : setIsSearchVisible(true))
      }
    }

    window.addEventListener('keydown', handleKeyboardShortcuts)
    return () => window.removeEventListener('keydown', handleKeyboardShortcuts)
  }, [isSearchVisible, isHomePage, isSearchDialogOpen])

  return {
    searchTerm,
    setSearchTerm,
    isSearchVisible,
    isSearchDialogOpen,
    setIsSearchDialogOpen,
    searchText,
    setSearchText,
    isHomePage,
    currentApp,
    handleSearch,
    toggleSearch,
  }
}
