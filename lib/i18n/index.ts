/**
 * Main internationalization module
 * Provides the core i18n functionality for the application
 */

export {
  translations,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
  type Translations,
} from './translations'

export {
  detectBrowserLanguage,
  isSupportedLanguage,
  getTranslation,
  createTranslationFunction,
  getLanguageNativeName,
  getLanguageEnglishName,
  normalizeLanguageCode,
  getAvailableLanguages,
  validateTranslations,
  getAllTranslationKeys,
  hasTranslationKey,
} from './utils'

// Re-export for convenience
import { detectBrowserLanguage, createTranslationFunction, normalizeLanguageCode } from './utils'
import { type SupportedLanguage } from './translations'

/**
 * Initialize i18n system with automatic language detection
 * @param preferredLanguage Optional preferred language override
 * @returns Object with detected language and translation function
 */
export function initializeI18n(preferredLanguage?: string) {
  let detectedLanguage: SupportedLanguage

  if (preferredLanguage) {
    detectedLanguage = normalizeLanguageCode(preferredLanguage)
  } else {
    detectedLanguage = detectBrowserLanguage()
  }

  const t = createTranslationFunction(detectedLanguage)

  return {
    language: detectedLanguage,
    t,
  }
}

// Export dev tools (only available in development)
export { validateAllTranslations, checkTranslationKeys, logTranslationStats } from './dev-tools'

/**
 * Default export for easy importing
 */
const i18n = {
  initializeI18n,
  detectBrowserLanguage,
  createTranslationFunction,
  normalizeLanguageCode,
}

export default i18n
