/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react'
import { useLanguageStore, getCurrentLanguageInfo } from '../languageStore'

// Mock the i18n utilities
jest.mock('@/lib/i18n', () => ({
  detectBrowserLanguage: jest.fn(() => 'en'),
  createTranslationFunction: jest.fn(
    lang => (key: string, fallback?: string) => `${lang}:${key}${fallback ? `:${fallback}` : ''}`
  ),
  normalizeLanguageCode: jest.fn(lang => {
    const supportedLangs = ['zh-CN', 'zh-TW', 'en', 'ja']
    return supportedLangs.includes(lang) ? lang : 'zh-CN'
  }),
  getAvailableLanguages: jest.fn(() => [
    { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', isDefault: true },
    { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', isDefault: false },
    { code: 'en', name: 'English', nativeName: 'English', isDefault: false },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', isDefault: false },
  ]),
}))

describe('languageStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()

    // Reset the store state
    useLanguageStore.setState({
      currentLanguage: 'zh-CN',
      availableLanguages: [
        { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', isDefault: true },
        { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', isDefault: false },
        { code: 'en', name: 'English', nativeName: 'English', isDefault: false },
        { code: 'ja', name: 'Japanese', nativeName: '日本語', isDefault: false },
      ],
    })
  })

  it('should initialize with default language', () => {
    const { result } = renderHook(() => useLanguageStore())

    expect(result.current.currentLanguage).toBe('zh-CN')
    expect(result.current.availableLanguages).toHaveLength(4)
  })

  it('should set language correctly', () => {
    const { result } = renderHook(() => useLanguageStore())

    act(() => {
      result.current.setLanguage('en')
    })

    expect(result.current.currentLanguage).toBe('en')
    expect(result.current.t('test.key')).toBe('en:test.key')
  })

  it('should normalize invalid language codes', () => {
    const { result } = renderHook(() => useLanguageStore())

    act(() => {
      result.current.setLanguage('invalid-lang')
    })

    expect(result.current.currentLanguage).toBe('zh-CN')
  })

  it('should initialize language from browser detection', () => {
    const { result } = renderHook(() => useLanguageStore())

    act(() => {
      result.current.initializeLanguage()
    })

    expect(result.current.currentLanguage).toBe('en') // Mocked to return 'en'
    expect(result.current.t('test.key')).toBe('en:test.key')
  })

  it('should provide translation function', () => {
    const { result } = renderHook(() => useLanguageStore())

    act(() => {
      result.current.setLanguage('ja')
    })

    expect(result.current.t('nav.game')).toBe('ja:nav.game')
    expect(result.current.t('nav.game', 'Games')).toBe('ja:nav.game:Games')
  })
})

describe('getCurrentLanguageInfo', () => {
  it('should return correct language info', () => {
    const info = getCurrentLanguageInfo('en')
    expect(info?.code).toBe('en')
    expect(info?.name).toBe('English')
    expect(info?.nativeName).toBe('English')
  })

  it('should return default language info for invalid code', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const info = getCurrentLanguageInfo('invalid' as any)
    expect(info?.code).toBe('zh-CN')
    expect(info?.isDefault).toBe(true)
  })
})
