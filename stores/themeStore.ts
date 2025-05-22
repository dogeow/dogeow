"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { configs } from '@/app/configs'
import type { CustomTheme } from '@/app/types'

interface ThemeState {
  currentTheme: string
  customThemes: CustomTheme[]
  followSystem: boolean
  setCurrentTheme: (theme: string) => void
  addCustomTheme: (theme: CustomTheme) => void
  removeCustomTheme: (id: string) => void
  setFollowSystem: (follow: boolean) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      currentTheme: configs.themeColors[0].id,
      customThemes: [],
      followSystem: false,
      setCurrentTheme: (theme) => set({ currentTheme: theme }),
      addCustomTheme: (theme) => set((state) => ({ 
        customThemes: [...state.customThemes, theme] 
      })),
      removeCustomTheme: (id) => set((state) => ({ 
        customThemes: state.customThemes.filter(theme => theme.id !== id),
        // 如果删除的是当前主题，则切换回默认主题
        currentTheme: state.currentTheme === id ? 'default' : state.currentTheme
      })),
      setFollowSystem: (follow) => set({ followSystem: follow })
    }),
    {
      name: 'theme-storage',
    }
  )
)

// 获取当前主题的色彩值
export const getCurrentThemeColor = (currentTheme: string, customThemes: CustomTheme[]): CustomTheme => {
  // 先从预设主题中查找
  const presetTheme = configs.themeColors.find(theme => theme.id === currentTheme);
  if (presetTheme) return presetTheme;
  
  // 再从自定义主题中查找
  const userTheme = customThemes.find(theme => theme.id === currentTheme);
  if (userTheme) return userTheme;
  
  // 默认返回第一个预设主题
  return configs.themeColors[0];
}; 