/**
 * 地理位置检测策略
 */
import type { SupportedLanguage } from '../translations'

export interface DetectionResult {
  language: SupportedLanguage
  confidence: number
}

export class GeolocationStrategy {
  private timezoneMap: Record<string, SupportedLanguage> = {
    'Asia/Shanghai': 'zh-CN',
    'Asia/Hong_Kong': 'zh-CN',
    'Asia/Taipei': 'zh-TW',
    'Asia/Tokyo': 'ja',
    'America/New_York': 'en',
    'America/Los_Angeles': 'en',
    'Europe/London': 'en',
    'Australia/Sydney': 'en',
  }

  async detect(): Promise<DetectionResult | null> {
    if (typeof window === 'undefined') {
      return null
    }

    try {
      const cached = this.getCachedGeolocationData()
      if (cached) {
        return cached
      }

      const timezoneResult = this.detectByTimezone()
      if (timezoneResult) {
        this.cacheGeolocationData(timezoneResult.language)
        return timezoneResult
      }
    } catch (error) {
      console.error('地理位置检测失败:', error)
    }

    return null
  }

  private detectByTimezone(): DetectionResult | null {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

      if (timezone) {
        const geoLanguage = this.timezoneMap[timezone]

        if (geoLanguage) {
          return {
            language: geoLanguage,
            confidence: 0.75,
          }
        }
      }
    } catch (error) {
      console.warn('时区检测失败:', error)
    }

    return null
  }

  private getCachedGeolocationData(): DetectionResult | null {
    try {
      const cachedGeoData = localStorage.getItem('dogeow-geo-language')
      if (!cachedGeoData) return null

      const parsed = JSON.parse(cachedGeoData)
      const now = Date.now()

      if (now - parsed.timestamp < 24 * 60 * 60 * 1000) {
        return {
          language: parsed.language,
          confidence: 0.75,
        }
      }
    } catch (error) {
      console.warn('解析缓存失败:', error)
    }

    return null
  }

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
      console.warn('缓存失败:', error)
    }
  }
}
