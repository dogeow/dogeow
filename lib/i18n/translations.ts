/**
 * Translation data for multi-language support
 * Supports: Chinese Simplified, Chinese Traditional, English, Japanese
 */

import { zh_CN, zh_TW, en, ja } from './langs'

export interface Translations {
  [languageCode: string]: {
    [key: string]: string
  }
}

export const translations: Translations = {
  'zh-CN': zh_CN,
  'zh-TW': zh_TW,
  en: en,
  ja: ja,
}

export { SUPPORTED_LANGUAGES, type SupportedLanguage } from './langs'
