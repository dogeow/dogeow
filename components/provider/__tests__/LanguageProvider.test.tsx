/**
 * Tests for LanguageProvider component
 */

import React from 'react'
import { render } from '@testing-library/react'
import { LanguageProvider } from '../LanguageProvider'
import { useLanguageStore } from '@/stores/languageStore'

// Mock the language store
jest.mock('@/stores/languageStore')
const mockUseLanguageStore = useLanguageStore as jest.MockedFunction<typeof useLanguageStore>

// Mock the useTranslation hook
jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    currentLanguage: 'en',
    t: (key: string, fallback?: string) => fallback || key,
    setLanguage: jest.fn(),
    currentLanguageInfo: { code: 'en', name: 'English', nativeName: 'English' },
    availableLanguages: [],
    isLanguageLoaded: true,
  }),
}))

describe('LanguageProvider', () => {
  beforeEach(() => {
    // Reset DOM
    document.documentElement.lang = 'zh-CN'

    mockUseLanguageStore.mockReturnValue({
      currentLanguage: 'en',
      availableLanguages: [],
      setLanguage: jest.fn(),
      t: jest.fn(),
      initializeLanguage: jest.fn(),
    })
  })

  it('should update html lang attribute when language changes', () => {
    render(
      <LanguageProvider>
        <div>Test content</div>
      </LanguageProvider>
    )

    // Should update to English
    expect(document.documentElement.lang).toBe('en')
  })

  it('should render children correctly', () => {
    const { getByText } = render(
      <LanguageProvider>
        <div>Test content</div>
      </LanguageProvider>
    )

    expect(getByText('Test content')).toBeInTheDocument()
  })
})
