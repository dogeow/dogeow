'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { configs } from '@/app/configs'
import type { CustomTheme } from '@/app/types'

interface ThemeState {
  currentTheme: string
  customThemes: CustomTheme[]
  followSystem: boolean
  previousThemeMode: string
  setCurrentTheme: (theme: string) => void
  addCustomTheme: (theme: CustomTheme) => void
  removeCustomTheme: (id: string) => void
  setFollowSystem: (follow: boolean, currentMode?: string) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    set => ({
      currentTheme: configs.themeColors[0].id,
      customThemes: [],
      followSystem: false,
      previousThemeMode: 'light',
      setCurrentTheme: theme => set({ currentTheme: theme }),
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
            // 启用跟随系统主题时，保存当前主题和模式
            return {
              followSystem: follow,
              previousThemeMode: currentMode || 'light',
            }
          } else {
            // 取消跟随系统主题时，恢复到之前的主题和模式
            return {
              followSystem: follow,
              previousThemeMode: state.previousThemeMode,
            }
          }
        }),
    }),
    {
      name: 'theme-storage',
    }
  )
)

// 获取当前主题的色彩值
export const getCurrentThemeColor = (
  currentTheme: string,
  customThemes: CustomTheme[]
): CustomTheme => {
  // 先从预设主题中查找
  const presetTheme = configs.themeColors.find(theme => theme.id === currentTheme)
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
  const defaultTheme = configs.themeColors[0]
  return {
    id: defaultTheme.id,
    name: defaultTheme.nameKey,
    primary: defaultTheme.primary,
    color: defaultTheme.color,
  }
}
