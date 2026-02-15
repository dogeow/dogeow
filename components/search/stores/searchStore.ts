'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * 搜索历史项
 */
export interface SearchHistoryItem {
  term: string
  timestamp: number
  category?: string
}

/**
 * 搜索状态
 */
interface SearchState {
  // 搜索历史
  searchHistory: SearchHistoryItem[]
  // 搜索建议
  suggestions: string[]
  // 添加搜索历史
  addSearchHistory: (term: string, category?: string) => void
  // 清除搜索历史
  clearSearchHistory: () => void
  // 删除单条历史
  removeSearchHistory: (term: string) => void
  // 设置搜索建议
  setSuggestions: (suggestions: string[]) => void
  // 清除搜索建议
  clearSuggestions: () => void
}

/**
 * 搜索状态 store
 *
 * @example
 * ```tsx
 * const { searchHistory, addSearchHistory } = useSearchStore()
 * ```
 */
export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      searchHistory: [],
      suggestions: [],

      addSearchHistory: (term: string, category?: string) => {
        const trimmedTerm = term.trim()
        if (!trimmedTerm) return

        set(state => {
          // 移除已存在的相同历史
          const filteredHistory = state.searchHistory.filter(
            item => item.term.toLowerCase() !== trimmedTerm.toLowerCase()
          )

          // 添加新历史到最前面
          const newHistory: SearchHistoryItem = {
            term: trimmedTerm,
            timestamp: Date.now(),
            category,
          }

          // 最多保留 20 条历史
          const updatedHistory = [newHistory, ...filteredHistory].slice(0, 20)

          return { searchHistory: updatedHistory }
        })
      },

      clearSearchHistory: () => {
        set({ searchHistory: [] })
      },

      removeSearchHistory: (term: string) => {
        set(state => ({
          searchHistory: state.searchHistory.filter(
            item => item.term.toLowerCase() !== term.toLowerCase()
          ),
        }))
      },

      setSuggestions: (suggestions: string[]) => {
        set({ suggestions })
      },

      clearSuggestions: () => {
        set({ suggestions: [] })
      },
    }),
    {
      name: 'search-storage',
      partialize: state => ({ searchHistory: state.searchHistory }),
    }
  )
)

/**
 * 获取最近的搜索历史
 */
export function getRecentSearches(count: number = 10): string[] {
  const history = useSearchStore.getState().searchHistory
  return history.slice(0, count).map(item => item.term)
}
