/**
 * Tests for LanguageProvider component
 */

import React from 'react'
import { render } from '@testing-library/react'
import { vi } from 'vitest'
import { LanguageProvider } from '../LanguageProvider'

// Mock the useTranslation hook
const mockUseTranslation = vi.fn()
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => mockUseTranslation(),
}))

describe('LanguageProvider', () => {
  beforeEach(() => {
    // Mock document if it doesn't exist
    if (typeof document === 'undefined') {
      Object.defineProperty(global, 'document', {
        value: {
          documentElement: {
            lang: 'zh-CN',
          },
        },
        writable: true,
      })
    } else {
      // Reset DOM
      document.documentElement.lang = 'zh-CN'
    }

    // Reset mock
    mockUseTranslation.mockReturnValue({
      currentLanguage: 'en',
      t: vi.fn(),
      setLanguage: vi.fn(),
      currentLanguageInfo: { code: 'en', name: 'English', nativeName: 'English' },
      availableLanguages: [],
      isLanguageLoaded: true,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should update html lang attribute when language changes', () => {
    const { rerender } = render(
      <LanguageProvider>
        <div>Test content</div>
      </LanguageProvider>
    )

    // Should update to English
    expect(document.documentElement.lang).toBe('en')

    // Change language to Chinese
    mockUseTranslation.mockReturnValue({
      currentLanguage: 'zh-CN',
      t: vi.fn(),
      setLanguage: vi.fn(),
      currentLanguageInfo: { code: 'zh-CN', name: 'Chinese', nativeName: '中文' },
      availableLanguages: [],
      isLanguageLoaded: true,
    })

    rerender(
      <LanguageProvider>
        <div>Test content</div>
      </LanguageProvider>
    )

    expect(document.documentElement.lang).toBe('zh-CN')
  })

  it('should render children correctly', () => {
    const { getByText } = render(
      <LanguageProvider>
        <div>Test content</div>
      </LanguageProvider>
    )

    expect(getByText('Test content')).toBeInTheDocument()
  })

  it('should handle multiple children', () => {
    const { getByText } = render(
      <LanguageProvider>
        <div>First child</div>
        <span>Second child</span>
      </LanguageProvider>
    )

    expect(getByText('First child')).toBeInTheDocument()
    expect(getByText('Second child')).toBeInTheDocument()
  })

  it('should handle different language codes', () => {
    const languages = ['fr', 'de', 'ja', 'ko', 'es']

    languages.forEach(lang => {
      mockUseTranslation.mockReturnValue({
        currentLanguage: lang,
        t: vi.fn(),
        setLanguage: vi.fn(),
        currentLanguageInfo: { code: lang, name: lang, nativeName: lang },
        availableLanguages: [],
        isLanguageLoaded: true,
      })

      render(
        <LanguageProvider>
          <div>Test content</div>
        </LanguageProvider>
      )

      expect(document.documentElement.lang).toBe(lang)
    })
  })

  it('should handle empty children', () => {
    const { container } = render(<LanguageProvider>{null}</LanguageProvider>)

    // The container should still exist
    expect(container).toBeInTheDocument()
  })

  it('should handle complex nested children', () => {
    const { getByTestId } = render(
      <LanguageProvider>
        <div data-testid="parent">
          <div data-testid="child1">
            <span data-testid="grandchild">Nested content</span>
          </div>
          <div data-testid="child2">Another child</div>
        </div>
      </LanguageProvider>
    )

    expect(getByTestId('parent')).toBeInTheDocument()
    expect(getByTestId('child1')).toBeInTheDocument()
    expect(getByTestId('child2')).toBeInTheDocument()
    expect(getByTestId('grandchild')).toBeInTheDocument()
  })
})
