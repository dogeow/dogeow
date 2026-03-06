'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PRESET_THEME_COLORS } from '@/lib/constants/theme-colors'
import type { CustomTheme } from '@/app/types'

/** 外观模式：浅色、深色、跟随系统、休息时段（可配置时间段内深色） */
export type ThemeMode = 'light' | 'dark' | 'system' | 'rest'

/** 休息时段：深色开始小时 (0-23)、深色结束小时 (0-23)，结束小时不包含。如 23,6 表示 23:00–5:59 深色 */
export interface RestPeriod {
  startHour: number
  endHour: number
}

const DEFAULT_REST_PERIOD: RestPeriod = { startHour: 23, endHour: 6 }

interface ThemeState {
  currentTheme: string
  customThemes: CustomTheme[]
  followSystem: boolean
  previousThemeMode: string
  themeMode: ThemeMode
  /** 休息时段配置，仅 themeMode===rest 时生效 */
  restPeriod: RestPeriod
  currentUITheme: string
  /** 是否启用自定义光标（需在 public/cursor 放置 pointer.cur / link.cur / text.cur） */
  customCursorEnabled: boolean
  /** 明亮/黑暗主题切换时背景色是否渐变过渡（1s） */
  themeTransitionEnabled: boolean
  setCurrentUITheme: (themeId: string) => void
  setCurrentTheme: (theme: string) => void
  setThemeMode: (mode: ThemeMode) => void
  setRestPeriod: (startHour: number, endHour: number) => void
  setCustomCursorEnabled: (enabled: boolean) => void
  setThemeTransitionEnabled: (enabled: boolean) => void
  addCustomTheme: (theme: CustomTheme) => void
  removeCustomTheme: (id: string) => void
  setFollowSystem: (follow: boolean, currentMode?: string) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    set => ({
      currentTheme: PRESET_THEME_COLORS[0].id,
      customThemes: [],
      followSystem: false,
      previousThemeMode: 'light',
      themeMode: 'light',
      restPeriod: DEFAULT_REST_PERIOD,
      setCurrentTheme: theme => set({ currentTheme: theme }),
      setThemeMode: mode =>
        set(state => ({
          themeMode: mode,
          followSystem: mode === 'system',
          previousThemeMode: mode === 'light' || mode === 'dark' ? mode : state.previousThemeMode,
        })),
      setRestPeriod: (startHour, endHour) =>
        set({
          restPeriod: {
            startHour: Math.max(0, Math.min(23, startHour)),
            endHour: Math.max(0, Math.min(23, endHour)),
          },
        }),
      currentUITheme: 'default',
      customCursorEnabled: false,
      themeTransitionEnabled: false,
      setCurrentUITheme: themeId => set({ currentUITheme: themeId }),
      setCustomCursorEnabled: enabled => set({ customCursorEnabled: enabled }),
      setThemeTransitionEnabled: enabled => set({ themeTransitionEnabled: enabled }),
      addCustomTheme: theme =>
        set(state => ({
          customThemes: [...state.customThemes, theme],
        })),
      removeCustomTheme: id =>
        set(state => ({
          customThemes: state.customThemes.filter(theme => theme.id !== id),
          // 如果删除的是当前主题，则切换回默认主题
          currentTheme: state.currentTheme === id ? 'default' : state.currentTheme,
        })),
      setFollowSystem: (follow, currentMode) =>
        set(state => {
          if (follow) {
            return {
              followSystem: follow,
              themeMode: 'system' as ThemeMode,
              previousThemeMode: currentMode || 'light',
            }
          }
          return {
            followSystem: follow,
            themeMode: (state.previousThemeMode === 'dark' ? 'dark' : 'light') as ThemeMode,
            previousThemeMode: state.previousThemeMode,
          }
        }),
    }),
    {
      name: 'theme-storage',
      version: 5,
      migrate: (persisted, version) => {
        if (persisted && typeof persisted === 'object') {
          const p = persisted as Record<string, unknown>
          const out = { ...p } as Record<string, unknown>
          if (version < 2) {
            if (p.themeMode == null) {
              out.themeMode =
                p.followSystem === true
                  ? 'system'
                  : p.previousThemeMode === 'dark'
                    ? 'dark'
                    : 'light'
            }
          }
          if (version < 3 || p.restPeriod == null) {
            out.restPeriod = DEFAULT_REST_PERIOD
          }
          if (version < 4 || p.customCursorEnabled == null) {
            out.customCursorEnabled = false
          }
          if (version < 5 || p.themeTransitionEnabled == null) {
            out.themeTransitionEnabled = false
          }
          return out as unknown as ThemeState
        }
        return persisted as unknown as ThemeState
      },
    }
  )
)

/** 根据休息时段配置判断当前是否处于休息时段（应使用深色） */
export function isRestPeriodNow(restPeriod: RestPeriod): boolean {
  const hour = new Date().getHours()
  const { startHour, endHour } = restPeriod
  if (startHour > endHour) {
    return hour >= startHour || hour < endHour
  }
  return hour >= startHour && hour < endHour
}

// 获取当前主题的色彩值
export const getCurrentThemeColor = (
  currentTheme: string,
  customThemes: CustomTheme[]
): CustomTheme => {
  // 先从预设主题中查找
  const presetTheme = PRESET_THEME_COLORS.find(theme => theme.id === currentTheme)
  if (presetTheme) {
    return {
      id: presetTheme.id,
      name: presetTheme.nameKey,
      primary: presetTheme.primary,
      color: presetTheme.color,
    }
  }

  // 再从自定义主题中查找
  const userTheme = customThemes.find(theme => theme.id === currentTheme)
  if (userTheme) return userTheme

  // 默认返回第一个预设主题
  const defaultTheme = PRESET_THEME_COLORS[0]
  return {
    id: defaultTheme.id,
    name: defaultTheme.nameKey,
    primary: defaultTheme.primary,
    color: defaultTheme.color,
  }
}
