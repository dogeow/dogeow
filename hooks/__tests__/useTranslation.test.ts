import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import { useTranslation, useT, useTranslationWithLanguage } from '../useTranslation'

// Mock the language store
const mockSetLanguage = vi.fn()
const mockInitializeLanguage = vi.fn()
const mockT = vi.fn(
  (key: string, fallback?: string) => `translated:${key}${fallback ? `:${fallback}` : ''}`
)

vi.mock('@/stores/languageStore', () => ({
  useLanguageStore: vi.fn(() => ({
    currentLanguage: 'zh-CN',
    availableLanguages: [
      { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', isDefault: true },
      { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', isDefault: false },
      { code: 'en', name: 'English', nativeName: 'English', isDefault: false },
      { code: 'ja', name: 'Japanese', nativeName: '日本語', isDefault: false },
    ],
    setLanguage: mockSetLanguage,
    t: mockT,
    initializeLanguage: mockInitializeLanguage,
  })),
  getCurrentLanguageInfo: vi.fn(lang => ({
    code: lang,
    name: lang === 'zh-CN' ? 'Chinese (Simplified)' : 'English',
    nativeName: lang === 'zh-CN' ? '简体中文' : 'English',
    isDefault: lang === 'zh-CN',
  })),
}))

// Mock the i18n utilities
vi.mock('@/lib/i18n', () => ({
  getTranslation: vi.fn(
    (key: string, language: string, fallback?: string) =>
      `${language}:${key}${fallback ? `:${fallback}` : ''}`
  ),
}))

describe('useTranslation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize language on mount', () => {
    renderHook(() => useTranslation())

    expect(mockInitializeLanguage).toHaveBeenCalledTimes(1)
  })

  it('should return translation function and language info', () => {
    const { result } = renderHook(() => useTranslation())

    expect(result.current.t).toBeDefined()
    expect(result.current.currentLanguage).toBe('zh-CN')
    expect(result.current.currentLanguageInfo).toBeDefined()
    expect(result.current.availableLanguages).toHaveLength(4)
    expect(result.current.setLanguage).toBeDefined()
    expect(result.current.isLanguageLoaded).toBe(true)
  })

  it('should call translation function correctly', () => {
    const { result } = renderHook(() => useTranslation())

    const translation = result.current.t('test.key')
    expect(translation).toBe('translated:test.key')
    expect(mockT).toHaveBeenCalledWith('test.key', undefined)
  })

  it('should call translation function with fallback', () => {
    const { result } = renderHook(() => useTranslation())

    const translation = result.current.t('test.key', 'Fallback Text')
    expect(translation).toBe('translated:test.key:Fallback Text')
    expect(mockT).toHaveBeenCalledWith('test.key', 'Fallback Text')
  })

  it('should call setLanguage when language is changed', () => {
    const { result } = renderHook(() => useTranslation())

    act(() => {
      result.current.setLanguage('en')
    })

    expect(mockSetLanguage).toHaveBeenCalledWith('en')
  })

  it('should provide currentLanguageInfo', () => {
    const { result } = renderHook(() => useTranslation())

    expect(result.current.currentLanguageInfo).toBeDefined()
    expect(result.current.currentLanguageInfo.code).toBe('zh-CN')
    expect(result.current.currentLanguageInfo.name).toBe('Chinese (Simplified)')
  })

  it('should provide availableLanguages', () => {
    const { result } = renderHook(() => useTranslation())

    expect(result.current.availableLanguages).toHaveLength(4)
    expect(result.current.availableLanguages[0].code).toBe('zh-CN')
    expect(result.current.availableLanguages[1].code).toBe('zh-TW')
    expect(result.current.availableLanguages[2].code).toBe('en')
    expect(result.current.availableLanguages[3].code).toBe('ja')
  })
})

describe('useT', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize language on mount', () => {
    renderHook(() => useT())

    expect(mockInitializeLanguage).toHaveBeenCalledTimes(1)
  })

  it('should return translation function', () => {
    const { result } = renderHook(() => useT())

    expect(typeof result.current).toBe('function')

    const translation = result.current('test.key')
    expect(translation).toBe('translated:test.key')
    expect(mockT).toHaveBeenCalledWith('test.key')
  })

  it('should handle fallback in translation function', () => {
    const { result } = renderHook(() => useT())

    const translation = result.current('test.key', 'Default')
    expect(translation).toBe('translated:test.key:Default')
    expect(mockT).toHaveBeenCalledWith('test.key', 'Default')
  })
})

describe('useTranslationWithLanguage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize language on mount', () => {
    renderHook(() => useTranslationWithLanguage())

    expect(mockInitializeLanguage).toHaveBeenCalledTimes(1)
  })

  it('should return translation function that accepts language parameter', () => {
    const { result } = renderHook(() => useTranslationWithLanguage())

    expect(typeof result.current).toBe('function')

    const translation = result.current('test.key', 'en')
    expect(translation).toBe('en:test.key')
  })

  it('should handle fallback with explicit language', () => {
    const { result } = renderHook(() => useTranslationWithLanguage())

    const translation = result.current('test.key', 'ja', 'Fallback')
    expect(translation).toBe('ja:test.key:Fallback')
  })
})
