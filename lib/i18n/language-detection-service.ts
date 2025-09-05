/**
 * 高级语言检测服务
 * 使用多种策略检测用户的首选语言
 * 实现了缓存和置信度评分
 */

import { type SupportedLanguage } from './translations'

// 常量配置
export const DETECTION_CONFIG = {
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24小时
  LOG_THROTTLE_MS: 2000, // 2秒内只输出一次日志
  GEO_CACHE_DURATION: 24 * 60 * 60 * 1000, // 地理位置缓存24小时
  DETECTION_TIMEOUT: 5000, // 检测超时时间
  POLLING_INTERVAL: 100, // 轮询间隔
} as const

// 置信度阈值
export const CONFIDENCE_THRESHOLDS = {
  STORED_PREFERENCE: 1.0,
  BROWSER_HIGH: 0.8,
  BROWSER_MEDIUM: 0.6,
  GEOLOCATION: 0.7,
  USER_AGENT: 0.6,
  DEFAULT: 0.5,
} as const

export interface LanguageDetectionResult {
  language: SupportedLanguage
  confidence: number
  method: DetectionMethod
  timestamp: number
}

export type DetectionMethod =
  | 'browser'
  | 'geolocation'
  | 'user_agent'
  | 'stored_preference'
  | 'default'

export interface GeolocationData {
  country: string
  region: string
  city: string
  timezone: string
  language?: string
}

// 日志级别
type LogLevel = 'info' | 'warn' | 'error' | 'debug'

// 日志接口
interface Logger {
  log(level: LogLevel, message: string, data?: unknown): void
  shouldLog(): boolean
}

/**
 * 多策略语言检测服务
 */
export class LanguageDetectionService {
  private static instance: LanguageDetectionService
  private cache: Map<string, LanguageDetectionResult> = new Map()
  private isDetecting = false
  private logger: Logger
  private detectionPromise: Promise<LanguageDetectionResult> | null = null

  private constructor() {
    this.logger = this.createLogger()
  }

  static getInstance(): LanguageDetectionService {
    if (!LanguageDetectionService.instance) {
      LanguageDetectionService.instance = new LanguageDetectionService()
    }
    return LanguageDetectionService.instance
  }

  /**
   * 创建日志记录器
   */
  private createLogger(): Logger {
    let lastLogTime = 0

    return {
      log: (level: LogLevel, message: string, data?: unknown) => {
        const now = Date.now()
        if (now - lastLogTime < DETECTION_CONFIG.LOG_THROTTLE_MS && level === 'info') {
          return
        }

        const prefix = '[LanguageDetection]'
        const logMessage = `${prefix} ${message}`

        switch (level) {
          case 'error':
            console.error(logMessage, data)
            break
          case 'warn':
            console.warn(logMessage, data)
            break
          case 'debug':
            console.debug(logMessage, data)
            break
          default:
            console.log(logMessage, data)
        }

        if (level === 'info') {
          lastLogTime = now
        }
      },
      shouldLog: () => {
        const now = Date.now()
        return now - lastLogTime >= DETECTION_CONFIG.LOG_THROTTLE_MS
      },
    }
  }

  /**
   * 使用多种策略检测语言
   */
  async detectLanguage(): Promise<LanguageDetectionResult> {
    const cacheKey = 'language-detection'
    const cached = this.cache.get(cacheKey)

    // 检查缓存
    if (cached && this.isCacheValid(cached)) {
      this.logger.log('info', '使用缓存结果:', {
        language: cached.language,
        method: cached.method,
        confidence: cached.confidence,
        age: `${Math.round((Date.now() - cached.timestamp) / 1000 / 60)} 分钟前`,
      })
      return cached
    }

    // 如果正在检测，返回现有的Promise
    if (this.detectionPromise) {
      this.logger.log('info', '检测正在进行中，等待现有检测完成...')
      return this.detectionPromise
    }

    // 开始新的检测
    this.detectionPromise = this.performDetectionWithTimeout()

    try {
      const result = await this.detectionPromise
      this.cache.set(cacheKey, result)

      this.logger.log('info', '检测完成:', {
        language: result.language,
        method: result.method,
        confidence: result.confidence,
        timestamp: new Date(result.timestamp).toISOString(),
      })

      return result
    } finally {
      this.detectionPromise = null
    }
  }

  /**
   * 检查缓存是否有效
   */
  private isCacheValid(cached: LanguageDetectionResult): boolean {
    return Date.now() - cached.timestamp < DETECTION_CONFIG.CACHE_DURATION
  }

  /**
   * 带超时的检测执行
   */
  private async performDetectionWithTimeout(): Promise<LanguageDetectionResult> {
    const timeoutPromise = new Promise<LanguageDetectionResult>((_, reject) => {
      setTimeout(() => {
        reject(new Error('语言检测超时'))
      }, DETECTION_CONFIG.DETECTION_TIMEOUT)
    })

    return Promise.race([this.performDetection(), timeoutPromise])
  }

  /**
   * 使用多种策略执行语言检测
   */
  private async performDetection(): Promise<LanguageDetectionResult> {
    this.logger.log('info', '开始语言检测...')

    // 定义检测策略
    const strategies = [
      {
        name: '已存储偏好',
        method: () => this.detectStoredPreference(),
        threshold: CONFIDENCE_THRESHOLDS.STORED_PREFERENCE,
      },
      {
        name: '浏览器语言',
        method: () => this.detectBrowserLanguage(),
        threshold: CONFIDENCE_THRESHOLDS.BROWSER_HIGH,
      },
      {
        name: '地理位置',
        method: () => this.detectByGeolocation(),
        threshold: CONFIDENCE_THRESHOLDS.GEOLOCATION,
      },
      {
        name: 'User Agent',
        method: () => this.detectByUserAgent(),
        threshold: CONFIDENCE_THRESHOLDS.USER_AGENT,
      },
    ]

    // 依次尝试各种策略
    for (const strategy of strategies) {
      try {
        this.logger.log('info', `尝试策略: ${strategy.name}`)
        const result = await strategy.method()

        if (result.confidence >= strategy.threshold) {
          this.logger.log('info', `✅ ${strategy.name}检测成功:`, {
            language: result.language,
            confidence: result.confidence,
            method: result.method,
          })
          return result
        } else {
          this.logger.log('info', `⚠️ ${strategy.name}置信度过低:`, result.confidence)
        }
      } catch (error) {
        this.logger.log('warn', `❌ ${strategy.name}检测失败:`, error)
      }
    }

    // 默认回退
    this.logger.log('info', '使用默认回退策略')
    return this.getDefaultResult()
  }

  /**
   * 检测已存储的偏好
   */
  private detectStoredPreference(): LanguageDetectionResult {
    const storedPreference = this.getStoredPreference()
    if (storedPreference) {
      return {
        language: storedPreference,
        confidence: CONFIDENCE_THRESHOLDS.STORED_PREFERENCE,
        method: 'stored_preference',
        timestamp: Date.now(),
      }
    }

    return {
      language: 'en',
      confidence: 0,
      method: 'default',
      timestamp: Date.now(),
    }
  }

  /**
   * 获取默认结果
   */
  private getDefaultResult(): LanguageDetectionResult {
    return {
      language: 'en',
      confidence: CONFIDENCE_THRESHOLDS.DEFAULT,
      method: 'default',
      timestamp: Date.now(),
    }
  }

  /**
   * 从浏览器设置检测语言
   */
  private detectBrowserLanguage(): LanguageDetectionResult {
    if (typeof window === 'undefined') {
      this.logger.log('info', '浏览器检测：服务端运行，使用默认值')
      return this.getDefaultResult()
    }

    try {
      const browserLanguages = navigator.languages || [navigator.language]
      this.logger.log('debug', '检测到浏览器语言列表:', browserLanguages)

      for (const browserLang of browserLanguages) {
        this.logger.log('debug', `处理浏览器语言: ${browserLang}`)

        // 直接匹配
        if (this.isSupportedLanguage(browserLang)) {
          this.logger.log('debug', `✅ 直接匹配: ${browserLang}`)
          return {
            language: browserLang as SupportedLanguage,
            confidence: 0.95,
            method: 'browser',
            timestamp: Date.now(),
          }
        }

        // 语言代码前缀匹配
        const [langCode, region] = browserLang.split('-', 2)
        this.logger.log('debug', `语言代码: ${langCode}, 地区: ${region || '无'}`)

        const matchingLangs = this.getSupportedLanguagesByPrefix(langCode)
        if (matchingLangs.length > 0) {
          this.logger.log(
            'debug',
            `找到${matchingLangs.length}个匹配语言:`,
            matchingLangs.map(lang => lang.code)
          )

          let confidence = 0.8

          // 地区完全匹配置信度更高
          if (region) {
            const exactMatch = matchingLangs.find(
              lang => lang.code.toLowerCase() === browserLang.toLowerCase()
            )
            if (exactMatch) {
              confidence = 0.9
              this.logger.log('debug', `✅ 地区完全匹配: ${exactMatch.code}`)
              return {
                language: exactMatch.code,
                confidence,
                method: 'browser',
                timestamp: Date.now(),
              }
            }
          }

          // 返回第一个匹配的语言
          const selectedLang = matchingLangs[0].code
          this.logger.log('debug', `✅ 使用第一个匹配语言: ${selectedLang}`)
          return {
            language: selectedLang,
            confidence,
            method: 'browser',
            timestamp: Date.now(),
          }
        } else {
          this.logger.log('debug', `❌ 未找到匹配语言: ${langCode}`)
        }
      }
    } catch (error) {
      this.logger.log('error', '浏览器语言检测失败:', error)
    }

    this.logger.log('info', '❌ 浏览器检测失败，使用默认值')
    return {
      language: 'zh-CN',
      confidence: 0.3,
      method: 'default',
      timestamp: Date.now(),
    }
  }

  /**
   * 通过地理位置检测语言
   */
  private async detectByGeolocation(): Promise<LanguageDetectionResult> {
    if (typeof window === 'undefined') {
      this.logger.log('info', '地理位置检测：服务端运行，使用默认值')
      return this.getDefaultResult()
    }

    try {
      this.logger.log('debug', '地理位置检测：检查缓存数据...')

      // 检查缓存的地理位置数据
      const cachedResult = this.getCachedGeolocationData()
      if (cachedResult) {
        this.logger.log('debug', '✅ 使用缓存的地理位置数据')
        return cachedResult
      }

      // 尝试从时区检测
      const timezoneResult = this.detectByTimezone()
      if (timezoneResult) {
        this.cacheGeolocationData(timezoneResult.language)
        return timezoneResult
      }

      // 尝试基于IP的地理位置检测
      const ipResult = await this.detectByIPGeolocation()
      if (ipResult) {
        return ipResult
      }
    } catch (error) {
      this.logger.log('error', '地理位置检测失败:', error)
    }

    this.logger.log('info', '❌ 地理位置检测失败，使用默认值')
    return {
      language: 'zh-CN',
      confidence: 0.3,
      method: 'default',
      timestamp: Date.now(),
    }
  }

  /**
   * 获取缓存的地理位置数据
   */
  private getCachedGeolocationData(): LanguageDetectionResult | null {
    try {
      const cachedGeoData = localStorage.getItem('dogeow-geo-language')
      if (!cachedGeoData) return null

      const parsed = JSON.parse(cachedGeoData)
      const now = Date.now()
      const age = Math.round((now - parsed.timestamp) / 1000 / 60)

      this.logger.log('debug', `找到缓存的地理位置数据（${age}分钟前）:`, parsed)

      // 检查缓存是否过期
      if (now - parsed.timestamp < DETECTION_CONFIG.GEO_CACHE_DURATION) {
        return {
          language: parsed.language,
          confidence: 0.75,
          method: 'geolocation',
          timestamp: Date.now(),
        }
      } else {
        this.logger.log('debug', '缓存的地理位置数据已过期，刷新...')
      }
    } catch (error) {
      this.logger.log('warn', '解析缓存的地理位置数据失败:', error)
    }

    return null
  }

  /**
   * 通过时区检测语言
   */
  private detectByTimezone(): LanguageDetectionResult | null {
    try {
      this.logger.log('debug', '地理位置检测：检查时区...')
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

      if (timezone) {
        this.logger.log('debug', `检测到时区: ${timezone}`)
        const geoLanguage = this.getLanguageFromTimezone(timezone)

        if (geoLanguage) {
          this.logger.log('debug', `✅ 通过时区推断语言: ${geoLanguage}`)
          return {
            language: geoLanguage,
            confidence: 0.75,
            method: 'geolocation',
            timestamp: Date.now(),
          }
        } else {
          this.logger.log('debug', `❌ 未找到时区映射: ${timezone}`)
        }
      } else {
        this.logger.log('debug', '❌ 无法检测到时区')
      }
    } catch (error) {
      this.logger.log('warn', '时区检测失败:', error)
    }

    return null
  }

  /**
   * 通过IP地理位置检测语言
   */
  private async detectByIPGeolocation(): Promise<LanguageDetectionResult | null> {
    try {
      this.logger.log('debug', '地理位置检测：尝试基于IP检测...')
      const ipGeoData = await this.getIPGeolocation()

      if (ipGeoData?.language) {
        this.logger.log('debug', 'IP地理位置数据:', ipGeoData)
        const supportedLang = this.normalizeLanguageCode(ipGeoData.language)

        if (supportedLang) {
          this.logger.log('debug', `✅ IP地理位置推断语言: ${supportedLang}`)
          return {
            language: supportedLang,
            confidence: 0.7,
            method: 'geolocation',
            timestamp: Date.now(),
          }
        }
      }
    } catch (error) {
      this.logger.log('warn', 'IP地理位置检测失败:', error)
    }

    return null
  }

  /**
   * 缓存地理位置数据
   */
  private cacheGeolocationData(language: SupportedLanguage): void {
    try {
      localStorage.setItem(
        'dogeow-geo-language',
        JSON.stringify({
          language,
          timestamp: Date.now(),
        })
      )
    } catch (error) {
      this.logger.log('warn', '缓存地理位置数据失败:', error)
    }
  }

  /**
   * 通过User Agent检测语言
   */
  private detectByUserAgent(): LanguageDetectionResult {
    if (typeof window === 'undefined') {
      this.logger.log('info', 'User Agent检测：服务端运行，使用默认值')
      return this.getDefaultResult()
    }

    try {
      this.logger.log('debug', 'User Agent检测：分析User Agent...')
      const userAgent = navigator.userAgent.toLowerCase()
      this.logger.log('debug', `User Agent: ${navigator.userAgent}`)

      // 定义语言特征映射
      const languagePatterns = [
        { patterns: ['zh-cn', 'zh_cn'], language: 'zh-CN' as SupportedLanguage },
        { patterns: ['zh-tw', 'zh_tw'], language: 'zh-TW' as SupportedLanguage },
        { patterns: ['ja', 'japanese'], language: 'ja' as SupportedLanguage },
        { patterns: ['en'], language: 'en' as SupportedLanguage },
      ]

      // 检查语言相关特征
      for (const { patterns, language } of languagePatterns) {
        if (patterns.some(pattern => userAgent.includes(pattern))) {
          this.logger.log('debug', `✅ User Agent检测到${language}`)
          return {
            language,
            confidence: CONFIDENCE_THRESHOLDS.USER_AGENT,
            method: 'user_agent',
            timestamp: Date.now(),
          }
        }
      }

      this.logger.log('debug', '❌ User Agent未检测到语言特征')
    } catch (error) {
      this.logger.log('error', 'User Agent检测失败:', error)
    }

    this.logger.log('info', '❌ User Agent检测失败，使用默认值')
    return {
      language: 'en',
      confidence: 0.3,
      method: 'default',
      timestamp: Date.now(),
    }
  }

  /**
   * 获取已存储的语言偏好
   */
  private getStoredPreference(): SupportedLanguage | null {
    if (typeof window === 'undefined') {
      this.logger.log('info', '已存储偏好：服务端运行')
      return null
    }

    try {
      const stored = localStorage.getItem('dogeow-language-preference')
      if (stored && this.isSupportedLanguage(stored)) {
        this.logger.log('debug', `✅ 找到已存储偏好: ${stored}`)
        return stored
      }

      if (stored) {
        this.logger.log('debug', `❌ 已存储偏好不被支持: ${stored}`)
      } else {
        this.logger.log('debug', '❌ 未找到已存储偏好')
      }
    } catch (error) {
      this.logger.log('warn', '获取已存储偏好失败:', error)
    }

    return null
  }

  /**
   * 根据时区获取推荐语言
   */
  private getLanguageFromTimezone(timezone: string): SupportedLanguage | null {
    const timezoneMap: Record<string, SupportedLanguage> = {
      // 亚洲时区
      'Asia/Shanghai': 'zh-CN',
      'Asia/Hong_Kong': 'zh-CN',
      'Asia/Chongqing': 'zh-CN',
      'Asia/Urumqi': 'zh-CN',
      'Asia/Taipei': 'zh-TW',
      'Asia/Tokyo': 'ja',
      'Asia/Seoul': 'en', // 韩国默认用英语

      // 美洲时区
      'America/New_York': 'en',
      'America/Los_Angeles': 'en',
      'America/Chicago': 'en',
      'America/Denver': 'en',
      'America/Toronto': 'en',
      'America/Vancouver': 'en',

      // 欧洲时区
      'Europe/London': 'en',
      'Europe/Paris': 'en',
      'Europe/Berlin': 'en',
      'Europe/Rome': 'en',
      'Europe/Madrid': 'en',
      'Europe/Amsterdam': 'en',

      // 大洋洲时区
      'Australia/Sydney': 'en',
      'Australia/Melbourne': 'en',
      'Pacific/Auckland': 'en',
    }

    const result = timezoneMap[timezone]
    if (result) {
      this.logger.log('debug', `✅ 时区${timezone}映射到语言: ${result}`)
    } else {
      this.logger.log('debug', `❌ 时区${timezone}无语言映射`)
    }

    return result || null
  }

  /**
   * 获取基于IP的地理位置（占位，未来可实现）
   */
  private async getIPGeolocation(): Promise<GeolocationData | null> {
    // 这是一个占位方法，未来可集成IP地理位置服务
    // 可集成如下服务：
    // - ipapi.co
    // - ipinfo.io
    // - freegeoip.app
    // - ip-api.com

    try {
      this.logger.log('debug', 'IP地理位置：未配置服务')

      // 示例实现（有API Key时可解开注释）
      /*
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      
      try {
        const response = await fetch('https://ipapi.co/json/', {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          },
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const data = await response.json()
          return {
            country: data.country_code,
            region: data.region,
            city: data.city,
            timezone: data.timezone,
            language: data.languages?.split(',')[0]
          }
        }
      } catch (fetchError) {
        clearTimeout(timeoutId)
        throw fetchError
      }
      */
    } catch (error) {
      this.logger.log('warn', 'IP地理位置检测失败:', error)
    }

    return null
  }

  /**
   * 检查语言是否被支持
   */
  private isSupportedLanguage(lang: string): lang is SupportedLanguage {
    const supportedLanguages: SupportedLanguage[] = ['zh-CN', 'zh-TW', 'en', 'ja']
    return supportedLanguages.includes(lang as SupportedLanguage)
  }

  /**
   * 根据前缀获取支持的语言
   */
  private getSupportedLanguagesByPrefix(
    prefix: string
  ): Array<{ code: SupportedLanguage; name: string }> {
    const supportedLanguages = [
      { code: 'zh-CN' as SupportedLanguage, name: 'Chinese (Simplified)' },
      { code: 'zh-TW' as SupportedLanguage, name: 'Chinese (Traditional)' },
      { code: 'en' as SupportedLanguage, name: 'English' },
      { code: 'ja' as SupportedLanguage, name: 'Japanese' },
    ]

    return supportedLanguages.filter(lang => lang.code.startsWith(prefix))
  }

  /**
   * 规范化语言代码
   */
  private normalizeLanguageCode(languageCode: string): SupportedLanguage | null {
    if (this.isSupportedLanguage(languageCode)) {
      return languageCode
    }

    const langPrefix = languageCode.split('-')[0]
    const matchedLang = this.getSupportedLanguagesByPrefix(langPrefix)

    return matchedLang.length > 0 ? matchedLang[0].code : null
  }

  /**
   * 清除检测缓存
   */
  clearCache(): void {
    this.logger.log('info', '清除检测缓存')
    this.cache.clear()

    // 同时清除localStorage中的缓存
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('dogeow-geo-language')
      } catch (error) {
        this.logger.log('warn', '清除localStorage缓存失败:', error)
      }
    }
  }

  /**
   * 获取检测统计信息
   */
  getDetectionStats(): {
    cacheSize: number
    lastDetection?: number
    isDetecting: boolean
    hasActivePromise: boolean
  } {
    const lastDetection = Array.from(this.cache.values()).sort(
      (a, b) => b.timestamp - a.timestamp
    )[0]?.timestamp

    const stats = {
      cacheSize: this.cache.size,
      lastDetection,
      isDetecting: this.isDetecting,
      hasActivePromise: this.detectionPromise !== null,
    }

    this.logger.log('info', '检测统计信息:', stats)
    return stats
  }

  /**
   * 强制重新检测语言
   */
  async forceRedetect(): Promise<LanguageDetectionResult> {
    this.logger.log('info', '强制重新检测语言')
    this.clearCache()

    // 取消现有的检测Promise
    if (this.detectionPromise) {
      this.detectionPromise = null
    }

    return this.detectLanguage()
  }
}

// 导出单例实例
export const languageDetectionService = LanguageDetectionService.getInstance()
