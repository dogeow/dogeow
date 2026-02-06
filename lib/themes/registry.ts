/**
 * 主题注册表
 * 管理所有可用的 UI 主题
 */

import type { ThemeRegistry, UITheme } from './types'
import { defaultTheme } from './default'
import { sidebarTheme } from './sidebar'
import { minimalTheme } from './minimal'
import { dashboardTheme } from './dashboard'

// 主题注册表
const themeRegistry: ThemeRegistry = {
  default: defaultTheme,
  sidebar: sidebarTheme,
  minimal: minimalTheme,
  dashboard: dashboardTheme,
}

// 自动注册默认主题（确保总是可用）
if (!themeRegistry.default) {
  themeRegistry.default = defaultTheme
}

/**
 * 注册新主题
 */
export function registerTheme(theme: UITheme): void {
  if (themeRegistry[theme.id]) {
    console.warn(`主题 ${theme.id} 已存在，将被覆盖`)
  }
  themeRegistry[theme.id] = theme
}

/**
 * 获取主题
 */
export function getTheme(themeId: string): UITheme | undefined {
  return themeRegistry[themeId]
}

/**
 * 获取所有主题
 */
export function getAllThemes(): ThemeRegistry {
  return { ...themeRegistry }
}

/**
 * 获取主题列表（用于选择器）
 */
export function getThemeList(): Array<{ id: string; name: string; description?: string }> {
  return Object.values(themeRegistry).map(theme => ({
    id: theme.id,
    name: theme.name,
    description: theme.description,
  }))
}

/**
 * 检查主题是否存在
 */
export function hasTheme(themeId: string): boolean {
  return themeId in themeRegistry
}

/**
 * 移除主题
 */
export function unregisterTheme(themeId: string): void {
  if (themeId === 'default') {
    console.warn('不能删除默认主题')
    return
  }
  delete themeRegistry[themeId]
}
