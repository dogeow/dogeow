/**
 * 主国际化模块
 * 为应用程序提供核心的 i18n 功能
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

// 便于使用的再导出
import { detectBrowserLanguage, createTranslationFunction, normalizeLanguageCode } from './utils'
import { type SupportedLanguage } from './translations'

/**
 * 初始化 i18n 系统并自动检测语言
 * @param preferredLanguage 可选的首选语言覆盖
 * @returns 返回检测到的语言和翻译函数对象
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

// 导出开发工具（仅在开发环境可用）
export { validateAllTranslations, checkTranslationKeys, logTranslationStats } from './dev-tools'

/**
 * 默认导出，便于导入
 */
const i18n = {
  initializeI18n,
  detectBrowserLanguage,
  createTranslationFunction,
  normalizeLanguageCode,
}

export default i18n
