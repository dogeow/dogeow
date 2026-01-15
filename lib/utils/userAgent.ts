import { Monitor } from 'lucide-react'
import type { IconType } from 'react-icons'
import {
  FaAndroid,
  FaApple,
  FaBlackberry,
  FaChrome,
  FaEdge,
  FaFirefox,
  FaSafari,
  FaWindows,
} from 'react-icons/fa'

export type IconComponent = IconType

export interface BrowserInfo {
  label: string
  Icon: IconComponent
}

export interface OSInfo {
  label: string
  Icon: IconComponent
}

// Browser Icons
const ChromeIcon: IconComponent = FaChrome

const WindowsIcon: IconComponent = FaWindows

const EdgeIcon: IconComponent = FaEdge

const FirefoxIcon: IconComponent = FaFirefox

const SafariIcon: IconComponent = FaSafari

const AndroidIcon: IconComponent = FaAndroid

const BlackBerryIcon: IconComponent = FaBlackberry

/**
 * 检测浏览器信息
 */
export function getBrowserInfo(userAgent?: string): BrowserInfo {
  if (!userAgent) {
    return { label: '未知浏览器', Icon: Monitor }
  }

  if (/Chrome|CriOS/i.test(userAgent) && !/Edg|OPR|Opera/i.test(userAgent)) {
    return { label: 'Chrome', Icon: ChromeIcon }
  }

  if (/Edg|EdgiOS|EdgA/i.test(userAgent)) {
    return { label: 'Edge', Icon: EdgeIcon }
  }

  if (/Firefox|FxiOS/i.test(userAgent)) {
    return { label: 'Firefox', Icon: FirefoxIcon }
  }

  if (/Safari/i.test(userAgent) && /Version/i.test(userAgent) && !/Chrome|CriOS/i.test(userAgent)) {
    return { label: 'Safari', Icon: SafariIcon }
  }

  return { label: '其他浏览器', Icon: Monitor }
}

/**
 * 检测操作系统信息
 */
export function getOSInfo(userAgent?: string): OSInfo {
  if (!userAgent) {
    return { label: '未知设备', Icon: Monitor }
  }

  if (/Windows NT/i.test(userAgent)) {
    return { label: 'Windows', Icon: WindowsIcon }
  }

  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return { label: 'Apple iOS', Icon: FaApple }
  }

  if (/Mac OS X/i.test(userAgent)) {
    return { label: 'Apple macOS', Icon: FaApple }
  }

  if (/BB10|BlackBerry/i.test(userAgent)) {
    return { label: 'BlackBerry', Icon: BlackBerryIcon }
  }

  if (/Android/i.test(userAgent)) {
    return { label: 'Android', Icon: AndroidIcon }
  }

  return { label: '其他设备', Icon: Monitor }
}
