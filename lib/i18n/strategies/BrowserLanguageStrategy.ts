/**
 * 浏览器语言检测策略
 */
import type { SupportedLanguage } from '../translations'

export interface DetectionResult {
  language: SupportedLanguage
  confidence: number
}

export class BrowserLanguageStrategy {
  private supportedLanguages: SupportedLanguage[] = ['zh-CN', 'zh-TW', 'en', 'ja']

  detect(): DetectionResult | null {
    if (typeof window === 'undefined') {
      return null
    }

    try {
      const browserLanguages = navigator.languages || [navigator.language]

      for (const browserLang of browserLanguages) {
        if (this.isSupportedLanguage(browserLang)) {
          return {
            language: browserLang as SupportedLanguage,
            confidence: 0.95,
          }
        }

        const [langCode] = browserLang.split('-', 2)
        const matchingLangs = this.getSupportedLanguagesByPrefix(langCode)

        if (matchingLangs.length > 0) {
          return {
            language: matchingLangs[0],
            confidence: 0.8,
          }
        }
      }
    } catch (error) {
      console.error('浏览器语言检测失败:', error)
    }

    return null
  }

  private isSupportedLanguage(lang: string): boolean {
    return this.supportedLanguages.includes(lang as SupportedLanguage)
  }

  private getSupportedLanguagesByPrefix(prefix: string): SupportedLanguage[] {
    return this.supportedLanguages.filter(lang => lang.startsWith(prefix))
  }
}
