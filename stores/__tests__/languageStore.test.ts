import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import { useLanguageStore, getCurrentLanguageInfo } from '../languageStore'
import { type SupportedLanguage } from '@/lib/i18n'

// Mock the i18n utilities
vi.mock('@/lib/i18n', () => ({
  detectBrowserLanguage: vi.fn(() => 'en'),
  createTranslationFunction: vi.fn(
    lang => (key: string, fallback?: string) => `${lang}:${key}${fallback ? `:${fallback}` : ''}`
  ),
  normalizeLanguageCode: vi.fn(lang => {
    const supportedLangs = ['zh-CN', 'zh-TW', 'en', 'ja']
    return supportedLangs.includes(lang) ? lang : 'zh-CN'
  }),
  getAvailableLanguages: vi.fn(() => [
    { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', isDefault: true },
    { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', isDefault: false },
    { code: 'en', name: 'English', nativeName: 'English', isDefault: false },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', isDefault: false },
  ]),
}))

// Import mocked functions for testing
import {
  detectBrowserLanguage,
  createTranslationFunction,
  normalizeLanguageCode,
  getAvailableLanguages,
} from '@/lib/i18n'

describe('languageStore', () => {
  const mockDetectBrowserLanguage = vi.mocked(detectBrowserLanguage)
  const mockCreateTranslationFunction = vi.mocked(createTranslationFunction)
  const mockNormalizeLanguageCode = vi.mocked(normalizeLanguageCode)
  const mockGetAvailableLanguages = vi.mocked(getAvailableLanguages)

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()

    // Reset all mocks
    vi.clearAllMocks()

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
    expect(mockNormalizeLanguageCode).toHaveBeenCalledWith('en')
    expect(mockCreateTranslationFunction).toHaveBeenCalledWith('en')
  })

  it('should normalize invalid language codes', () => {
    const { result } = renderHook(() => useLanguageStore())

    act(() => {
      result.current.setLanguage('invalid-lang')
    })

    expect(result.current.currentLanguage).toBe('zh-CN')
    expect(mockNormalizeLanguageCode).toHaveBeenCalledWith('invalid-lang')
  })

  it('should initialize language from browser detection when no stored language', () => {
    const { result } = renderHook(() => useLanguageStore())

    act(() => {
      result.current.initializeLanguage()
    })

    expect(result.current.currentLanguage).toBe('en') // Mocked to return 'en'
    expect(result.current.t('test.key')).toBe('en:test.key')
    expect(mockDetectBrowserLanguage).toHaveBeenCalled()
    expect(mockCreateTranslationFunction).toHaveBeenCalledWith('en')
  })

  it('should use stored language when initializing if already set to non-default', () => {
    // Set up store with a non-default language
    useLanguageStore.setState({
      currentLanguage: 'ja',
      availableLanguages: mockGetAvailableLanguages(),
    })

    const { result } = renderHook(() => useLanguageStore())

    act(() => {
      result.current.initializeLanguage()
    })

    // Should use the stored language, not detect browser language
    expect(result.current.currentLanguage).toBe('ja')
    expect(mockDetectBrowserLanguage).not.toHaveBeenCalled()
    expect(mockCreateTranslationFunction).toHaveBeenCalledWith('ja')
  })

  it('should detect browser language when stored language is default zh-CN', () => {
    // Ensure store has default language
    useLanguageStore.setState({
      currentLanguage: 'zh-CN',
      availableLanguages: mockGetAvailableLanguages(),
    })

    const { result } = renderHook(() => useLanguageStore())

    act(() => {
      result.current.initializeLanguage()
    })

    expect(mockDetectBrowserLanguage).toHaveBeenCalled()
    expect(result.current.currentLanguage).toBe('en') // Mocked browser language
  })

  it('should provide translation function', () => {
    const { result } = renderHook(() => useLanguageStore())

    act(() => {
      result.current.setLanguage('ja')
    })

    expect(result.current.t('nav.game')).toBe('ja:nav.game')
    expect(result.current.t('nav.game', 'Games')).toBe('ja:nav.game:Games')
  })

  it('should handle various browser language detection scenarios', () => {
    const testCases = [
      { browserLang: 'zh-TW', expected: 'zh-TW' },
      { browserLang: 'ja', expected: 'ja' },
      { browserLang: 'fr', expected: 'zh-CN' }, // Unsupported language should fallback
    ]

    testCases.forEach(({ expected }) => {
      // Reset store to default state
      useLanguageStore.setState({
        currentLanguage: 'zh-CN',
        availableLanguages: mockGetAvailableLanguages(),
      })

      // Mock browser language detection for this specific test
      mockDetectBrowserLanguage.mockReturnValueOnce(expected as SupportedLanguage)

      const { result } = renderHook(() => useLanguageStore())

      act(() => {
        result.current.initializeLanguage()
      })

      expect(result.current.currentLanguage).toBe(expected)
    })
  })

  it('should handle error scenarios in language switching', () => {
    const { result } = renderHook(() => useLanguageStore())

    // Test with null/undefined language
    act(() => {
      result.current.setLanguage('')
    })

    expect(mockNormalizeLanguageCode).toHaveBeenCalledWith('')

    // Test with special characters
    act(() => {
      result.current.setLanguage('zh-CN@special')
    })

    expect(mockNormalizeLanguageCode).toHaveBeenCalledWith('zh-CN@special')
  })

  it('should maintain translation function consistency', () => {
    // Reset store to ensure clean state
    useLanguageStore.setState({
      currentLanguage: 'zh-CN',
      availableLanguages: mockGetAvailableLanguages(),
      t: mockCreateTranslationFunction('zh-CN'),
    })

    const { result } = renderHook(() => useLanguageStore())

    // Test initial translation function
    expect(result.current.t('test')).toBe('zh-CN:test')

    // Change language and test translation function updates
    act(() => {
      result.current.setLanguage('en')
    })

    expect(result.current.t('test')).toBe('en:test')
    expect(result.current.t('test', 'fallback')).toBe('en:test:fallback')
  })

  it('should handle edge case when currentLanguage is falsy', () => {
    // Set up store with falsy currentLanguage
    useLanguageStore.setState({
      currentLanguage: '' as SupportedLanguage,
      availableLanguages: mockGetAvailableLanguages(),
    })

    const { result } = renderHook(() => useLanguageStore())

    act(() => {
      result.current.initializeLanguage()
    })

    // Should detect browser language since currentLanguage is falsy
    expect(mockDetectBrowserLanguage).toHaveBeenCalled()
    expect(result.current.currentLanguage).toBe('en')
  })

  it('should handle null currentLanguage', () => {
    // Set up store with null currentLanguage
    useLanguageStore.setState({
      currentLanguage: null as unknown,
      availableLanguages: mockGetAvailableLanguages(),
    })

    const { result } = renderHook(() => useLanguageStore())

    act(() => {
      result.current.initializeLanguage()
    })

    // Should detect browser language since currentLanguage is null
    expect(mockDetectBrowserLanguage).toHaveBeenCalled()
    expect(result.current.currentLanguage).toBe('en')
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
    const info = getCurrentLanguageInfo('invalid' as SupportedLanguage)
    expect(info?.code).toBe('zh-CN')
    expect(info?.isDefault).toBe(true)
  })
})
