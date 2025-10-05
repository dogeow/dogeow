/**
 * 语言国旗映射工具
 * 提供统一的国旗获取功能
 */

// 语言代码到国旗的映射
const LANGUAGE_FLAG_MAP: Record<string, string> = {
  'zh-CN': '🇨🇳',
  'zh-TW': '🇭🇰',
  en: '🇺🇸',
  ja: '🇯🇵',
}

/**
 * 根据语言代码获取对应的国旗
 * @param languageCode 语言代码 (如 'zh-CN', 'en', 'ja')
 * @returns 对应的国旗 emoji，如果未找到则返回默认的🌐
 */
export function getLanguageFlag(languageCode?: string): string {
  if (!languageCode) return '🌐'
  return LANGUAGE_FLAG_MAP[languageCode] || '🌐'
}

/**
 * 获取所有支持的语言代码
 * @returns 支持的语言代码数组
 */
export function getSupportedLanguageCodes(): string[] {
  return Object.keys(LANGUAGE_FLAG_MAP)
}

/**
 * 检查语言代码是否支持国旗显示
 * @param languageCode 语言代码
 * @returns 是否支持国旗显示
 */
export function hasLanguageFlag(languageCode: string): boolean {
  return languageCode in LANGUAGE_FLAG_MAP
}
