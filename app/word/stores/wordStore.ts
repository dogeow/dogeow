import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Word, UserWordSetting, LearningStatus, WordMemoryStatus } from '../types'

interface WordState {
  // 当前学习的单词列表
  currentWords: Word[]
  // 当前单词索引
  currentIndex: number
  // 当前学习状态
  learningStatus: LearningStatus
  // 当前单词的记忆状态
  currentWordMemoryStatus: WordMemoryStatus
  // 是否显示翻译
  showTranslation: boolean
  // 每日进度
  dailyProgress: {
    learned: number
    reviewed: number
  }
  // 用户设置
  settings: UserWordSetting | null
  // 学习开始时间
  studyStartTime: Date | null

  // Actions
  setCurrentWords: (words: Word[]) => void
  setCurrentIndex: (index: number) => void
  nextWord: () => void
  previousWord: () => void
  setLearningStatus: (status: LearningStatus) => void
  setCurrentWordMemoryStatus: (status: WordMemoryStatus) => void
  toggleTranslation: () => void
  markWord: (remembered: boolean) => void
  updateDailyProgress: (type: 'learned' | 'reviewed') => void
  setSettings: (settings: UserWordSetting) => void
  updateSettings: (settings: Partial<UserWordSetting>) => void
  startStudy: () => void
  reset: () => void
}

export const useWordStore = create<WordState>()(
  persist(
    (set, get) => ({
      currentWords: [],
      currentIndex: 0,
      learningStatus: 'idle',
      currentWordMemoryStatus: 'unknown',
      showTranslation: false,
      dailyProgress: {
        learned: 0,
        reviewed: 0,
      },
      settings: null,
      studyStartTime: null,

      setCurrentWords: words => {
        set({
          currentWords: words,
          currentIndex: 0,
          showTranslation: false,
          currentWordMemoryStatus: 'unknown',
        })
      },

      setCurrentIndex: index => {
        const { currentWords } = get()
        if (index >= 0 && index < currentWords.length) {
          set({
            currentIndex: index,
            showTranslation: false,
            currentWordMemoryStatus: 'unknown',
          })
        }
      },

      nextWord: () => {
        const { currentIndex, currentWords } = get()
        if (currentIndex < currentWords.length - 1) {
          set({
            currentIndex: currentIndex + 1,
            showTranslation: false,
            currentWordMemoryStatus: 'unknown',
          })
        } else {
          // 所有单词学习完成
          set({ learningStatus: 'completed' })
        }
      },

      previousWord: () => {
        const { currentIndex } = get()
        if (currentIndex > 0) {
          set({
            currentIndex: currentIndex - 1,
            showTranslation: false,
            currentWordMemoryStatus: 'unknown',
          })
        }
      },

      setLearningStatus: status => {
        set({ learningStatus: status })
      },

      setCurrentWordMemoryStatus: status => {
        set({ currentWordMemoryStatus: status })
      },

      toggleTranslation: () => {
        set(state => ({ showTranslation: !state.showTranslation }))
      },

      markWord: remembered => {
        const { currentIndex, currentWords, learningStatus } = get()
        const word = currentWords[currentIndex]

        if (!word) return

        // 更新记忆状态
        set({
          currentWordMemoryStatus: remembered ? 'remembered' : 'forgotten',
          showTranslation: true,
        })

        // 更新进度
        if (learningStatus === 'learning') {
          get().updateDailyProgress('learned')
        } else if (learningStatus === 'reviewing') {
          get().updateDailyProgress('reviewed')
        }
      },

      updateDailyProgress: type => {
        set(state => ({
          dailyProgress: {
            ...state.dailyProgress,
            [type]: state.dailyProgress[type] + 1,
          },
        }))
      },

      setSettings: settings => {
        set({ settings })
      },

      updateSettings: partialSettings => {
        set(state => ({
          settings: state.settings ? { ...state.settings, ...partialSettings } : null,
        }))
      },

      startStudy: () => {
        set({
          studyStartTime: new Date(),
          learningStatus: 'idle',
          dailyProgress: {
            learned: 0,
            reviewed: 0,
          },
        })
      },

      reset: () => {
        set({
          currentWords: [],
          currentIndex: 0,
          learningStatus: 'idle',
          currentWordMemoryStatus: 'unknown',
          showTranslation: false,
          dailyProgress: {
            learned: 0,
            reviewed: 0,
          },
          studyStartTime: null,
        })
      },
    }),
    {
      name: 'word-store',
      partialize: state => ({
        dailyProgress: state.dailyProgress,
      }),
    }
  )
)
