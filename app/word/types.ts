// 单词相关类型定义

export interface Word {
  id: number
  content: string
  phonetic_us?: string
  explanation?: {
    en?: string
    zh?: string
  }
  example_sentences?: Array<{
    en: string
    zh: string
  }>
  difficulty: number
  frequency: number
  book?: Book
}

export interface Book {
  id: number
  name: string
  description?: string
  difficulty: number
  total_words: number
  sort_order: number
  category?: Category
}

export interface Category {
  id: number
  name: string
  description?: string
  sort_order: number
}

export interface UserWord {
  id: number
  user_id: number
  word_id: number
  word_book_id: number
  status: number // 0=未学习, 1=学习中, 2=已掌握, 3=困难词
  stage: number // 复习阶段 0-7
  ease_factor: number // 难度因子
  review_count: number
  correct_count: number
  wrong_count: number
  is_favorite: boolean
  last_review_at?: string
  next_review_at?: string
  personal_note?: string
}

export interface UserWordSetting {
  id: number
  user_id: number
  daily_new_words: number
  review_multiplier: number // 1/2/3倍
  current_book_id?: number
  is_auto_pronounce: boolean
  current_book?: Book
}

export interface CheckIn {
  id: number
  user_id: number
  check_in_date: string
  new_words_count: number
  review_words_count: number
  study_duration: number
}

export interface CalendarDay {
  date: string
  checked: boolean
  new_words_count: number
  review_words_count: number
}

export interface CalendarData {
  year: number
  month: number
  calendar: CalendarDay[]
}

export interface WordProgress {
  total_words: number
  learned_words: number
  mastered_words: number
  difficult_words: number
  progress_percentage: number
}

export interface WordStats {
  check_in_days: number
  learned_words_count: number
  total_words: number
  progress_percentage: number
  today_checked_in: boolean
}

// 学习状态
export type LearningStatus = 'idle' | 'learning' | 'reviewing' | 'completed'

// 单词记忆状态
export type WordMemoryStatus = 'unknown' | 'remembered' | 'forgotten'
