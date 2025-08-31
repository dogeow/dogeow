/**
 * Advanced language detection service
 * Uses multiple strategies to detect user's preferred language
 * Implements caching and confidence scoring
 */

import { type SupportedLanguage } from './translations'

export interface LanguageDetectionResult {
  language: SupportedLanguage
  confidence: number
  method: 'browser' | 'geolocation' | 'user_agent' | 'stored_preference' | 'default'
  timestamp: number
}

export interface GeolocationData {
  country: string
  region: string
  city: string
  timezone: string
  language?: string
}

/**
 * Language detection service with multiple strategies
 */
export class LanguageDetectionService {
  private static instance: LanguageDetectionService
  private cache: Map<string, LanguageDetectionResult> = new Map()
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
  private isDetecting = false
  private lastLogTime = 0
  private readonly LOG_THROTTLE_MS = 2000 // 2秒内只输出一次日志

  static getInstance(): LanguageDetectionService {
    if (!LanguageDetectionService.instance) {
      LanguageDetectionService.instance = new LanguageDetectionService()
    }
    return LanguageDetectionService.instance
  }

  /**
   * Detect language using multiple strategies
   */
  async detectLanguage(): Promise<LanguageDetectionResult> {
    const cacheKey = 'language-detection'
    const cached = this.cache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      const now = Date.now()
      if (now - this.lastLogTime > this.LOG_THROTTLE_MS) {
        console.log('[LanguageDetection] Using cached result:', {
          language: cached.language,
          method: cached.method,
          confidence: cached.confidence,
          age: `${Math.round((now - cached.timestamp) / 1000 / 60)} minutes ago`,
        })
        this.lastLogTime = now
      }
      return cached
    }

    // 防止重复检测
    if (this.isDetecting) {
      console.log('[LanguageDetection] Detection already in progress, waiting...')
      // 等待当前检测完成
      while (this.isDetecting) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      // 重新检查缓存
      const updatedCache = this.cache.get(cacheKey)
      if (updatedCache) {
        return updatedCache
      }
    }

    this.isDetecting = true
    console.log('[LanguageDetection] Starting language detection...')

    try {
      const result = await this.performDetection()
      this.cache.set(cacheKey, result)

      console.log('[LanguageDetection] Detection completed:', {
        language: result.language,
        method: result.method,
        confidence: result.confidence,
        timestamp: new Date(result.timestamp).toISOString(),
      })

      return result
    } finally {
      this.isDetecting = false
    }
  }

  /**
   * Perform language detection using multiple strategies
   */
  private async performDetection(): Promise<LanguageDetectionResult> {
    const now = Date.now()
    if (now - this.lastLogTime < this.LOG_THROTTLE_MS) {
      // 如果最近已经输出过日志，减少详细输出
      console.log('[LanguageDetection] Performing detection (reduced logging)...')
    } else {
      console.group('[LanguageDetection] Performing detection with multiple strategies')
      this.lastLogTime = now
    }

    // Strategy 1: Stored user preference (highest priority)
    if (now - this.lastLogTime >= this.LOG_THROTTLE_MS) {
      console.log('[LanguageDetection] Strategy 1: Checking stored user preference...')
    }
    const storedPreference = this.getStoredPreference()
    if (storedPreference) {
      if (now - this.lastLogTime >= this.LOG_THROTTLE_MS) {
        console.log('[LanguageDetection] ✅ Found stored preference:', storedPreference)
        console.groupEnd()
      }
      return {
        language: storedPreference,
        confidence: 1.0,
        method: 'stored_preference',
        timestamp: Date.now(),
      }
    }
    if (now - this.lastLogTime >= this.LOG_THROTTLE_MS) {
      console.log('[LanguageDetection] ❌ No stored preference found')
    }

    // Strategy 2: Browser language detection
    if (now - this.lastLogTime >= this.LOG_THROTTLE_MS) {
      console.log('[LanguageDetection] Strategy 2: Browser language detection...')
    }
    const browserResult = this.detectBrowserLanguage()
    if (browserResult.confidence > 0.8) {
      if (now - this.lastLogTime >= this.LOG_THROTTLE_MS) {
        console.log('[LanguageDetection] ✅ Browser detection successful:', {
          language: browserResult.language,
          confidence: browserResult.confidence,
          method: browserResult.method,
        })
        console.groupEnd()
      }
      return browserResult
    }
    if (now - this.lastLogTime >= this.LOG_THROTTLE_MS) {
      console.log(
        '[LanguageDetection] ⚠️ Browser detection confidence too low:',
        browserResult.confidence
      )
    }

    // Strategy 3: Geolocation-based detection
    if (now - this.lastLogTime >= this.LOG_THROTTLE_MS) {
      console.log('[LanguageDetection] Strategy 3: Geolocation-based detection...')
    }
    try {
      const geoResult = await this.detectByGeolocation()
      if (geoResult.confidence > 0.7) {
        if (now - this.lastLogTime >= this.LOG_THROTTLE_MS) {
          console.log('[LanguageDetection] ✅ Geolocation detection successful:', {
            language: geoResult.language,
            confidence: geoResult.confidence,
            method: geoResult.method,
          })
          console.groupEnd()
        }
        return geoResult
      }
      if (now - this.lastLogTime >= this.LOG_THROTTLE_MS) {
        console.log(
          '[LanguageDetection] ⚠️ Geolocation detection confidence too low:',
          geoResult.confidence
        )
      }
    } catch (error) {
      if (now - this.lastLogTime >= this.LOG_THROTTLE_MS) {
        console.warn('[LanguageDetection] ❌ Geolocation detection failed:', error)
      }
    }

    // Strategy 4: User agent analysis
    if (now - this.lastLogTime >= this.LOG_THROTTLE_MS) {
      console.log('[LanguageDetection] Strategy 4: User agent analysis...')
    }
    const userAgentResult = this.detectByUserAgent()
    if (userAgentResult.confidence > 0.6) {
      if (now - this.lastLogTime >= this.LOG_THROTTLE_MS) {
        console.log('[LanguageDetection] ✅ User agent detection successful:', {
          language: userAgentResult.language,
          confidence: userAgentResult.confidence,
          method: userAgentResult.method,
        })
        console.groupEnd()
      }
      return userAgentResult
    }
    if (now - this.lastLogTime >= this.LOG_THROTTLE_MS) {
      console.log(
        '[LanguageDetection] ⚠️ User agent detection confidence too low:',
        userAgentResult.confidence
      )
    }

    // Strategy 5: Default fallback
    if (now - this.lastLogTime >= this.LOG_THROTTLE_MS) {
      console.log('[LanguageDetection] Strategy 5: Using default fallback (en)')
      console.groupEnd()
    }
    return {
      language: 'en',
      confidence: 0.5,
      method: 'default',
      timestamp: Date.now(),
    }
  }

  /**
   * Detect language from browser settings
   */
  private detectBrowserLanguage(): LanguageDetectionResult {
    if (typeof window === 'undefined') {
      console.log('[LanguageDetection] Browser detection: Running on server side, using default')
      return {
        language: 'zh-CN',
        confidence: 0.5,
        method: 'default',
        timestamp: Date.now(),
      }
    }

    try {
      const browserLanguages = navigator.languages || [navigator.language]
      console.log('[LanguageDetection] Browser languages detected:', browserLanguages)

      for (const browserLang of browserLanguages) {
        console.log(`[LanguageDetection] Processing browser language: ${browserLang}`)

        // Direct match
        if (this.isSupportedLanguage(browserLang)) {
          console.log(`[LanguageDetection] ✅ Direct match found: ${browserLang}`)
          return {
            language: browserLang as SupportedLanguage,
            confidence: 0.95,
            method: 'browser',
            timestamp: Date.now(),
          }
        }

        // Language code match
        const langCode = browserLang.split('-')[0]
        const region = browserLang.split('-')[1]
        console.log(`[LanguageDetection] Language code: ${langCode}, Region: ${region || 'none'}`)

        const matchingLangs = this.getSupportedLanguagesByPrefix(langCode)
        if (matchingLangs.length > 0) {
          console.log(
            `[LanguageDetection] Found ${matchingLangs.length} matching languages:`,
            matchingLangs.map(lang => lang.code)
          )

          let confidence = 0.8

          // Higher confidence for exact region match
          if (region) {
            const exactMatch = matchingLangs.find(
              lang => lang.code.toLowerCase() === browserLang.toLowerCase()
            )
            if (exactMatch) {
              confidence = 0.9
              console.log(`[LanguageDetection] ✅ Exact region match: ${exactMatch.code}`)
              return {
                language: exactMatch.code,
                confidence,
                method: 'browser',
                timestamp: Date.now(),
              }
            }
          }

          // Return first matching language
          const selectedLang = matchingLangs[0].code
          console.log(`[LanguageDetection] ✅ Using first matching language: ${selectedLang}`)
          return {
            language: selectedLang,
            confidence,
            method: 'browser',
            timestamp: Date.now(),
          }
        } else {
          console.log(`[LanguageDetection] ❌ No matching languages found for: ${langCode}`)
        }
      }
    } catch (error) {
      console.warn('[LanguageDetection] Browser language detection failed:', error)
    }

    console.log('[LanguageDetection] ❌ Browser detection failed, using default')
    return {
      language: 'zh-CN',
      confidence: 0.3,
      method: 'default',
      timestamp: Date.now(),
    }
  }

  /**
   * Detect language by geolocation
   */
  private async detectByGeolocation(): Promise<LanguageDetectionResult> {
    try {
      console.log('[LanguageDetection] Geolocation detection: Checking cached data...')

      // Check if we have stored geolocation data
      const cachedGeoData = localStorage.getItem('dogeow-geo-language')
      if (cachedGeoData) {
        const parsed = JSON.parse(cachedGeoData)
        const now = Date.now()
        const age = Math.round((now - parsed.timestamp) / 1000 / 60)
        console.log(
          `[LanguageDetection] Found cached geolocation data (${age} minutes old):`,
          parsed
        )

        // Cache geolocation data for 24 hours
        if (now - parsed.timestamp < 24 * 60 * 60 * 1000) {
          console.log('[LanguageDetection] ✅ Using cached geolocation data')
          return {
            language: parsed.language,
            confidence: 0.75,
            method: 'geolocation',
            timestamp: Date.now(),
          }
        } else {
          console.log('[LanguageDetection] Cached geolocation data expired, refreshing...')
        }
      }

      // Try to detect from navigator properties
      console.log('[LanguageDetection] Geolocation detection: Checking timezone...')
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (timezone) {
        console.log(`[LanguageDetection] Detected timezone: ${timezone}`)
        const geoLanguage = this.getLanguageFromTimezone(timezone)
        if (geoLanguage) {
          console.log(`[LanguageDetection] ✅ Language inferred from timezone: ${geoLanguage}`)
          // Cache the result
          localStorage.setItem(
            'dogeow-geo-language',
            JSON.stringify({
              language: geoLanguage,
              timestamp: Date.now(),
            })
          )
          return {
            language: geoLanguage,
            confidence: 0.75,
            method: 'geolocation',
            timestamp: Date.now(),
          }
        } else {
          console.log(`[LanguageDetection] ❌ No language mapping found for timezone: ${timezone}`)
        }
      } else {
        console.log('[LanguageDetection] ❌ Could not detect timezone')
      }

      // Try IP-based geolocation (if available)
      console.log('[LanguageDetection] Geolocation detection: Trying IP-based detection...')
      const ipGeoData = await this.getIPGeolocation()
      if (ipGeoData?.language) {
        console.log('[LanguageDetection] IP geolocation data:', ipGeoData)
        const supportedLang = this.normalizeLanguageCode(ipGeoData.language)
        if (supportedLang) {
          console.log(`[LanguageDetection] ✅ Language from IP geolocation: ${supportedLang}`)
          return {
            language: supportedLang,
            confidence: 0.7,
            method: 'geolocation',
            timestamp: Date.now(),
          }
        }
      }
    } catch (error) {
      console.warn('[LanguageDetection] Geolocation detection failed:', error)
    }

    console.log('[LanguageDetection] ❌ Geolocation detection failed, using default')
    return {
      language: 'zh-CN',
      confidence: 0.3,
      method: 'default',
      timestamp: Date.now(),
    }
  }

  /**
   * Detect language from user agent
   */
  private detectByUserAgent(): LanguageDetectionResult {
    if (typeof window === 'undefined') {
      console.log('[LanguageDetection] User agent detection: Running on server side, using default')
      return {
        language: 'zh-CN',
        confidence: 0.5,
        method: 'default',
        timestamp: Date.now(),
      }
    }

    try {
      console.log('[LanguageDetection] User agent detection: Analyzing user agent...')
      const userAgent = navigator.userAgent.toLowerCase()
      console.log(`[LanguageDetection] User agent: ${navigator.userAgent}`)

      // Check for language-specific patterns
      if (userAgent.includes('zh-cn') || userAgent.includes('zh_cn')) {
        console.log('[LanguageDetection] ✅ Detected Chinese Simplified from user agent')
        return {
          language: 'zh-CN',
          confidence: 0.6,
          method: 'user_agent',
          timestamp: Date.now(),
        }
      }

      if (userAgent.includes('zh-tw') || userAgent.includes('zh_tw')) {
        console.log('[LanguageDetection] ✅ Detected Chinese Traditional from user agent')
        return {
          language: 'zh-TW',
          confidence: 0.6,
          method: 'user_agent',
          timestamp: Date.now(),
        }
      }

      if (userAgent.includes('ja') || userAgent.includes('japanese')) {
        console.log('[LanguageDetection] ✅ Detected Japanese from user agent')
        return {
          language: 'ja',
          confidence: 0.6,
          method: 'user_agent',
          timestamp: Date.now(),
        }
      }

      if (userAgent.includes('en')) {
        console.log('[LanguageDetection] ✅ Detected English from user agent')
        return {
          language: 'en',
          confidence: 0.6,
          method: 'user_agent',
          timestamp: Date.now(),
        }
      }

      // Check navigator properties
      console.log('[LanguageDetection] User agent detection: Checking navigator properties...')
      // Note: navigator.userLanguage and navigator.systemLanguage are deprecated
      // We'll rely on navigator.language and navigator.languages instead

      console.log('[LanguageDetection] ❌ No language patterns found in user agent')
    } catch (error) {
      console.warn('[LanguageDetection] User agent detection failed:', error)
    }

    console.log('[LanguageDetection] ❌ User agent detection failed, using default')
    return {
      language: 'en',
      confidence: 0.3,
      method: 'default',
      timestamp: Date.now(),
    }
  }

  /**
   * Get stored language preference
   */
  private getStoredPreference(): SupportedLanguage | null {
    if (typeof window === 'undefined') {
      console.log('[LanguageDetection] Stored preference: Running on server side')
      return null
    }

    try {
      const stored = localStorage.getItem('dogeow-language-preference')
      if (stored && this.isSupportedLanguage(stored)) {
        console.log(`[LanguageDetection] ✅ Found stored preference: ${stored}`)
        return stored
      }
      if (stored) {
        console.log(`[LanguageDetection] ❌ Stored preference not supported: ${stored}`)
      } else {
        console.log('[LanguageDetection] ❌ No stored preference found')
      }
    } catch (error) {
      console.warn('[LanguageDetection] Failed to get stored preference:', error)
    }

    return null
  }

  /**
   * Get language suggestion from timezone
   */
  private getLanguageFromTimezone(timezone: string): SupportedLanguage | null {
    const timezoneMap: Record<string, SupportedLanguage> = {
      'Asia/Shanghai': 'zh-CN',
      'Asia/Hong_Kong': 'zh-CN',
      'Asia/Chongqing': 'zh-CN',
      'Asia/Urumqi': 'zh-CN',
      'Asia/Taipei': 'zh-TW',
      'Asia/Tokyo': 'ja',
      'Asia/Seoul': 'en', // Default to English for Korea
      'America/New_York': 'en',
      'America/Los_Angeles': 'en',
      'America/Chicago': 'en',
      'America/Denver': 'en',
      'Europe/London': 'en',
      'Europe/Paris': 'en',
      'Europe/Berlin': 'en',
      'Europe/Rome': 'en',
      'Europe/Madrid': 'en',
      'Australia/Sydney': 'en',
      'Australia/Melbourne': 'en',
    }

    const result = timezoneMap[timezone]
    if (result) {
      console.log(`[LanguageDetection] ✅ Timezone ${timezone} mapped to language: ${result}`)
    } else {
      console.log(`[LanguageDetection] ❌ No language mapping for timezone: ${timezone}`)
    }

    return result || null
  }

  /**
   * Get IP-based geolocation (placeholder for future implementation)
   */
  private async getIPGeolocation(): Promise<GeolocationData | null> {
    // This is a placeholder for future IP geolocation service integration
    // You can integrate with services like:
    // - ipapi.co
    // - ipinfo.io
    // - freegeoip.app
    // - ip-api.com

    try {
      console.log('[LanguageDetection] IP geolocation: Service not configured')
      // Example implementation (uncomment when you have an API key)
      /*
      const response = await fetch('https://ipapi.co/json/')
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
      */
    } catch (error) {
      console.warn('[LanguageDetection] IP geolocation failed:', error)
    }

    return null
  }

  /**
   * Check if language is supported
   */
  private isSupportedLanguage(lang: string): lang is SupportedLanguage {
    const supportedLanguages = ['zh-CN', 'zh-TW', 'en', 'ja']
    return supportedLanguages.includes(lang)
  }

  /**
   * Get supported languages by prefix
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
   * Normalize language code
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
   * Clear detection cache
   */
  clearCache(): void {
    console.log('[LanguageDetection] Clearing detection cache')
    this.cache.clear()
  }

  /**
   * Get detection statistics
   */
  getDetectionStats(): { cacheSize: number; lastDetection?: number } {
    const lastDetection = Array.from(this.cache.values()).sort(
      (a, b) => b.timestamp - a.timestamp
    )[0]?.timestamp

    const stats = {
      cacheSize: this.cache.size,
      lastDetection,
    }

    console.log('[LanguageDetection] Detection stats:', stats)
    return stats
  }
}

// Export singleton instance
export const languageDetectionService = LanguageDetectionService.getInstance()
