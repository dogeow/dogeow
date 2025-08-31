/**
 * Internationalization utility functions
 */

import { translations, SUPPORTED_LANGUAGES, type SupportedLanguage } from './translations'

/**
 * Default language fallback order
 */
const DEFAULT_LANGUAGE: SupportedLanguage = 'zh-CN'
const FALLBACK_ORDER: SupportedLanguage[] = ['zh-CN', 'en']

/**
 * Enhanced language detection with multiple strategies
 * 1. Browser language preferences
 * 2. Geolocation-based language suggestion
 * 3. User's previous language choice
 * 4. System language detection
 */
export function detectBrowserLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE
  }

  try {
    // Strategy 1: Check for stored language preference first
    const storedLanguage = localStorage.getItem('dogeow-language-preference')
    if (storedLanguage && isSupportedLanguage(storedLanguage)) {
      return storedLanguage
    }

    // Strategy 2: Get browser languages in order of preference
    const browserLanguages = navigator.languages || [navigator.language]

    // Enhanced language matching with fuzzy logic
    for (const browserLang of browserLanguages) {
      // Direct match (e.g., 'zh-CN')
      if (isSupportedLanguage(browserLang)) {
        return browserLang
      }

      // Language code match with region preference (e.g., 'zh' -> 'zh-CN' over 'zh-TW')
      const langCode = browserLang.split('-')[0]
      const region = browserLang.split('-')[1]

      // Find all matching languages
      const matchingLangs = SUPPORTED_LANGUAGES.filter(lang => lang.code.startsWith(langCode))

      if (matchingLangs.length > 0) {
        // If we have region info, prefer exact region match
        if (region) {
          const exactMatch = matchingLangs.find(
            lang => lang.code.toLowerCase() === browserLang.toLowerCase()
          )
          if (exactMatch) return exactMatch.code
        }

        // Otherwise, return the first matching language (usually the most common)
        return matchingLangs[0].code
      }
    }

    // Strategy 3: Geolocation-based language suggestion
    const geoLanguage = detectLanguageByGeolocation()
    if (geoLanguage) {
      return geoLanguage
    }

    // Strategy 4: System language detection
    const systemLanguage = detectSystemLanguage()
    if (systemLanguage) {
      return systemLanguage
    }
  } catch (error) {
    console.warn('Failed to detect browser language:', error)
  }

  return DEFAULT_LANGUAGE
}

/**
 * Detect language based on user's geolocation
 * Uses IP geolocation to suggest appropriate language
 */
function detectLanguageByGeolocation(): SupportedLanguage | null {
  try {
    // Check if we have stored geolocation data
    const geoData = localStorage.getItem('dogeow-geo-language')
    if (geoData) {
      const parsed = JSON.parse(geoData)
      const now = Date.now()
      // Cache geolocation data for 24 hours
      if (now - parsed.timestamp < 24 * 60 * 60 * 1000) {
        return parsed.language
      }
    }

    // Try to detect from navigator properties
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (timezone) {
      const geoLanguage = getLanguageFromTimezone(timezone)
      if (geoLanguage) {
        // Cache the result
        localStorage.setItem(
          'dogeow-geo-language',
          JSON.stringify({
            language: geoLanguage,
            timestamp: Date.now(),
          })
        )
        return geoLanguage
      }
    }
  } catch (error) {
    console.warn('Failed to detect language by geolocation:', error)
  }

  return null
}

/**
 * Get language suggestion from timezone
 */
function getLanguageFromTimezone(timezone: string): SupportedLanguage | null {
  const timezoneMap: Record<string, SupportedLanguage> = {
    'Asia/Shanghai': 'zh-CN',
    'Asia/Hong_Kong': 'zh-CN',
    'Asia/Taipei': 'zh-TW',
    'Asia/Tokyo': 'ja',
    'America/New_York': 'en',
    'America/Los_Angeles': 'en',
    'Europe/London': 'en',
    'Europe/Paris': 'en',
    'Europe/Berlin': 'en',
  }

  return timezoneMap[timezone] || null
}

/**
 * Detect system language from various sources
 */
function detectSystemLanguage(): SupportedLanguage | null {
  try {
    // Check navigator.userLanguage (IE)
    if (navigator.userLanguage) {
      const lang = normalizeLanguageCode(navigator.userLanguage)
      if (isSupportedLanguage(lang)) {
        return lang
      }
    }

    // Check navigator.systemLanguage (IE)
    if (navigator.systemLanguage) {
      const lang = normalizeLanguageCode(navigator.systemLanguage)
      if (isSupportedLanguage(lang)) {
        return lang
      }
    }

    // Check for common language patterns in user agent
    const userAgent = navigator.userAgent.toLowerCase()
    if (userAgent.includes('zh-cn') || userAgent.includes('zh_cn')) {
      return 'zh-CN'
    }
    if (userAgent.includes('zh-tw') || userAgent.includes('zh_tw')) {
      return 'zh-TW'
    }
    if (userAgent.includes('ja') || userAgent.includes('japanese')) {
      return 'ja'
    }
    if (userAgent.includes('en')) {
      return 'en'
    }
  } catch (error) {
    console.warn('Failed to detect system language:', error)
  }

  return null
}

/**
 * Checks if a language code is supported
 */
export function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return SUPPORTED_LANGUAGES.some(supportedLang => supportedLang.code === lang)
}

/**
 * Gets translation for a key with fallback mechanism
 * @param key Translation key
 * @param language Current language
 * @param fallback Optional fallback text
 * @returns Translated text or fallback
 */
export function getTranslation(
  key: string,
  language: SupportedLanguage,
  fallback?: string
): string {
  // Validate inputs
  if (!key || typeof key !== 'string') {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Invalid translation key provided: ${key}`)
    }
    return fallback || ''
  }

  // Try current language
  const currentLangTranslations = translations[language]
  if (currentLangTranslations && currentLangTranslations[key]) {
    return currentLangTranslations[key]
  }

  // Try fallback languages in order
  for (const fallbackLang of FALLBACK_ORDER) {
    if (fallbackLang === language) continue // Skip if same as current

    const fallbackTranslations = translations[fallbackLang]
    if (fallbackTranslations && fallbackTranslations[key]) {
      // Log missing translation in development with more context
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[i18n] Translation missing for key "${key}" in language "${language}", using fallback "${fallbackLang}". Consider adding translation for better user experience.`
        )
      }
      return fallbackTranslations[key]
    }
  }

  // Use provided fallback
  if (fallback) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[i18n] Translation missing for key "${key}" in language "${language}", using provided fallback: "${fallback}"`
      )
    }
    return fallback
  }

  // Last resort: return the key itself
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `[i18n] Translation missing for key "${key}" in language "${language}", returning key as fallback. This may result in poor user experience.`
    )
  }
  return key
}

/**
 * Creates a translation function bound to a specific language
 * @param language Current language
 * @returns Translation function
 */
export function createTranslationFunction(language: SupportedLanguage) {
  return (key: string, fallback?: string): string => {
    return getTranslation(key, language, fallback)
  }
}

/**
 * Gets language display name in its native script
 * @param languageCode Language code
 * @returns Native name or language code if not found
 */
export function getLanguageNativeName(languageCode: string): string {
  const language = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode)
  return language?.nativeName || languageCode
}

/**
 * Gets language display name in English
 * @param languageCode Language code
 * @returns English name or language code if not found
 */
export function getLanguageEnglishName(languageCode: string): string {
  const language = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode)
  return language?.name || languageCode
}

/**
 * Validates and normalizes a language code
 * @param languageCode Input language code
 * @returns Valid language code or default language
 */
export function normalizeLanguageCode(languageCode: string): SupportedLanguage {
  if (isSupportedLanguage(languageCode)) {
    return languageCode
  }

  // Try to match by language prefix
  const langPrefix = languageCode.split('-')[0]
  const matchedLang = SUPPORTED_LANGUAGES.find(lang => lang.code.startsWith(langPrefix))

  return matchedLang?.code || DEFAULT_LANGUAGE
}

/**
 * Gets all available languages with their metadata
 */
export function getAvailableLanguages() {
  return SUPPORTED_LANGUAGES.map(lang => ({
    ...lang,
    isDefault: lang.code === DEFAULT_LANGUAGE,
  }))
}

/**
 * Validates translation completeness across all languages (development only)
 * @param keys Array of translation keys to validate
 * @returns Validation report
 */
export function validateTranslations(keys: string[]) {
  if (process.env.NODE_ENV !== 'development') {
    return { isValid: true, missingTranslations: [] }
  }

  const missingTranslations: Array<{ key: string; language: string }> = []

  for (const key of keys) {
    for (const lang of SUPPORTED_LANGUAGES) {
      const langTranslations = translations[lang.code]
      if (!langTranslations || !langTranslations[key]) {
        missingTranslations.push({ key, language: lang.code })
      }
    }
  }

  const isValid = missingTranslations.length === 0

  if (!isValid) {
    console.group('[i18n] Translation Validation Report')
    console.warn(`Found ${missingTranslations.length} missing translations:`)
    missingTranslations.forEach(({ key, language }) => {
      console.warn(`  - "${key}" missing in "${language}"`)
    })
    console.groupEnd()
  }

  return { isValid, missingTranslations }
}

/**
 * Gets all translation keys from the default language
 * Useful for validation and development tools
 */
export function getAllTranslationKeys(): string[] {
  const defaultTranslations = translations[DEFAULT_LANGUAGE]
  return defaultTranslations ? Object.keys(defaultTranslations) : []
}

/**
 * Checks if a translation key exists in any language
 * @param key Translation key to check
 * @returns True if key exists in at least one language
 */
export function hasTranslationKey(key: string): boolean {
  return SUPPORTED_LANGUAGES.some(lang => {
    const langTranslations = translations[lang.code]
    return langTranslations && langTranslations[key]
  })
}
