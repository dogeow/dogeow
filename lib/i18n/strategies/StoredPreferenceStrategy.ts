/**
 * 存储偏好检测策略
 */
import type { SupportedLanguage } from '../translations'

export interface DetectionResult {
  language: SupportedLanguage
  confidence: number
}

export class StoredPreferenceStrategy {
  private supportedLanguages: SupportedLanguage[] = ['zh-CN', 'zh-TW', 'en', 'ja']

  detect(): DetectionResult | null {
    if (typeof window === 'undefined') {
      return null
    }

    try {
      const stored = localStorage.getItem('dogeow-language-preference')
      if (stored && this.isSupportedLanguage(stored)) {
        return {
          language: stored,
          confidence: 1.0,
        }
      }
    } catch (error) {
      console.warn('获取已存储偏好失败:', error)
    }

    return null
  }

  private isSupportedLanguage(lang: string): lang is SupportedLanguage {
    return this.supportedLanguages.includes(lang as SupportedLanguage)
  }
}
