// 国际化工具函数

import { translations, SUPPORTED_LANGUAGES, type SupportedLanguage } from './translations'

// 默认语言
const DEFAULT_LANGUAGE: SupportedLanguage = 'zh-CN'
// 语言回退顺序
const FALLBACK_ORDER: SupportedLanguage[] = ['zh-CN', 'en']

/**
 * 检测浏览器语言，支持多种策略：
 * 1. 用户本地存储的语言偏好
 * 2. 浏览器语言优先级
 * 3. 地理位置推测
 * 4. 系统语言
 */
export function detectBrowserLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE
  }

  try {
    // 优先读取本地存储的语言设置
    const storedLanguage = localStorage.getItem('dogeow-language-preference')
    if (storedLanguage && isSupportedLanguage(storedLanguage)) {
      return storedLanguage
    }

    // 获取浏览器语言列表
    const browserLanguages = navigator.languages || [navigator.language]

    // 遍历浏览器语言，模糊匹配
    for (const browserLang of browserLanguages) {
      // 完全匹配（如 'zh-CN'）
      if (isSupportedLanguage(browserLang)) {
        return browserLang
      }

      // 只匹配语言前缀（如 'zh' -> 'zh-CN' 优先于 'zh-TW'）
      const langCode = browserLang.split('-')[0]
      const region = browserLang.split('-')[1]

      // 找到所有前缀匹配的语言
      const matchingLangs = SUPPORTED_LANGUAGES.filter(lang => lang.code.startsWith(langCode))

      if (matchingLangs.length > 0) {
        // 有地区信息时优先精确匹配
        if (region) {
          const exactMatch = matchingLangs.find(
            lang => lang.code.toLowerCase() === browserLang.toLowerCase()
          )
          if (exactMatch) return exactMatch.code
        }
        // 否则返回第一个匹配（通常为主流地区）
        return matchingLangs[0].code
      }
    }

    // 地理位置推测语言
    const geoLanguage = detectLanguageByGeolocation()
    if (geoLanguage) {
      return geoLanguage
    }

    // 系统语言检测
    const systemLanguage = detectSystemLanguage()
    if (systemLanguage) {
      return systemLanguage
    }
  } catch (error) {
    console.warn('检测浏览器语言失败:', error)
  }

  return DEFAULT_LANGUAGE
}

/**
 * 根据地理位置推测语言（如时区）
 * 利用本地缓存减少请求
 */
function detectLanguageByGeolocation(): SupportedLanguage | null {
  try {
    // 读取本地缓存的地理语言
    const geoData = localStorage.getItem('dogeow-geo-language')
    if (geoData) {
      const parsed = JSON.parse(geoData)
      const now = Date.now()
      // 24小时内有效
      if (now - parsed.timestamp < 24 * 60 * 60 * 1000) {
        return parsed.language
      }
    }

    // 通过时区推测
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (timezone) {
      const geoLanguage = getLanguageFromTimezone(timezone)
      if (geoLanguage) {
        // 缓存推测结果
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
    console.warn('地理位置推测语言失败:', error)
  }

  return null
}

/**
 * 根据时区返回推荐语言
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
 * 检测系统语言（兼容IE等老浏览器）
 */
function detectSystemLanguage(): SupportedLanguage | null {
  try {
    // IE: navigator.userLanguage
    if (
      'userLanguage' in navigator &&
      (navigator as Navigator & { userLanguage?: string }).userLanguage
    ) {
      const lang = normalizeLanguageCode(
        (navigator as Navigator & { userLanguage?: string }).userLanguage!
      )
      if (isSupportedLanguage(lang)) {
        return lang
      }
    }

    // IE: navigator.systemLanguage
    if (
      'systemLanguage' in navigator &&
      (navigator as Navigator & { systemLanguage?: string }).systemLanguage
    ) {
      const lang = normalizeLanguageCode(
        (navigator as Navigator & { systemLanguage?: string }).systemLanguage!
      )
      if (isSupportedLanguage(lang)) {
        return lang
      }
    }

    // 从 userAgent 字符串中提取常见语言
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
    console.warn('系统语言检测失败:', error)
  }

  return null
}

/**
 * 判断语言代码是否受支持
 */
export function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return SUPPORTED_LANGUAGES.some(supportedLang => supportedLang.code === lang)
}

/**
 * 获取翻译文本，带多级回退机制
 * @param key 翻译key
 * @param language 当前语言
 * @param fallback 可选的备用文本
 * @returns 翻译文本或备用
 */
export function getTranslation(
  key: string,
  language: SupportedLanguage,
  fallback?: string
): string {
  // 校验key合法性
  if (!key || typeof key !== 'string') {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`无效的翻译key: ${key}`)
    }
    return fallback || ''
  }

  // 当前语言有翻译
  const currentLangTranslations = translations[language]
  if (currentLangTranslations && currentLangTranslations[key]) {
    return currentLangTranslations[key]
  }

  // 按回退顺序查找
  for (const fallbackLang of FALLBACK_ORDER) {
    if (fallbackLang === language) continue // 跳过当前语言

    const fallbackTranslations = translations[fallbackLang]
    if (fallbackTranslations && fallbackTranslations[key]) {
      // 开发环境下提示缺失
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[i18n] 语言 "${language}" 缺少 key "${key}"，使用回退 "${fallbackLang}"。建议补全翻译。`
        )
      }
      return fallbackTranslations[key]
    }
  }

  // 使用传入的备用文本
  if (fallback) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[i18n] 语言 "${language}" 缺少 key "${key}"，使用传入备用: "${fallback}"`)
    }
    return fallback
  }

  // 最后返回key本身
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[i18n] 语言 "${language}" 缺少 key "${key}"，直接返回key。`)
  }
  return key
}

/**
 * 生成绑定指定语言的翻译函数
 * @param language 当前语言
 * @returns 翻译函数
 */
export function createTranslationFunction(language: SupportedLanguage) {
  return (key: string, fallback?: string): string => {
    return getTranslation(key, language, fallback)
  }
}

/**
 * 获取语言的本地显示名
 * @param languageCode 语言代码
 * @returns 本地名或代码
 */
export function getLanguageNativeName(languageCode: string): string {
  const language = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode)
  return language?.nativeName || languageCode
}

/**
 * 获取语言的英文显示名
 * @param languageCode 语言代码
 * @returns 英文名或代码
 */
export function getLanguageEnglishName(languageCode: string): string {
  const language = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode)
  return language?.name || languageCode
}

/**
 * 规范化语言代码，自动回退
 * @param languageCode 输入的语言代码
 * @returns 有效的语言代码
 */
export function normalizeLanguageCode(languageCode: string): SupportedLanguage {
  if (isSupportedLanguage(languageCode)) {
    return languageCode
  }

  // 尝试用前缀匹配
  const langPrefix = languageCode.split('-')[0]
  const matchedLang = SUPPORTED_LANGUAGES.find(lang => lang.code.startsWith(langPrefix))

  return matchedLang?.code || DEFAULT_LANGUAGE
}

/**
 * 获取所有可用语言及其元数据
 */
export function getAvailableLanguages() {
  return SUPPORTED_LANGUAGES.map(lang => ({
    ...lang,
    isDefault: lang.code === DEFAULT_LANGUAGE,
  }))
}

/**
 * 校验所有语言的翻译完整性（仅开发环境）
 * @param keys 需要校验的key数组
 * @returns 校验报告
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
    console.group('[i18n] 翻译完整性校验报告')
    console.warn(`发现 ${missingTranslations.length} 处翻译缺失:`)
    missingTranslations.forEach(({ key, language }) => {
      console.warn(`  - "${key}" 缺少 "${language}" 语言`)
    })
    console.groupEnd()
  }

  return { isValid, missingTranslations }
}

/**
 * 获取默认语言下的所有翻译key
 * 便于校验和开发工具
 */
export function getAllTranslationKeys(): string[] {
  const defaultTranslations = translations[DEFAULT_LANGUAGE]
  return defaultTranslations ? Object.keys(defaultTranslations) : []
}

/**
 * 检查某个翻译key是否在任意语言中存在
 * @param key 翻译key
 * @returns 是否存在
 */
export function hasTranslationKey(key: string): boolean {
  return SUPPORTED_LANGUAGES.some(lang => {
    const langTranslations = translations[lang.code]
    return langTranslations && langTranslations[key]
  })
}
