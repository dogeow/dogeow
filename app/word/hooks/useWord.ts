import useSWR from 'swr'
import useSWRInfinite from 'swr/infinite'
import { get, post, put } from '@/lib/api'
import type {
  Word,
  Book,
  UserWordSetting,
  WordProgress,
  WordStats,
  CalendarData,
  YearCalendarData,
  RangeCalendarData,
} from '../types'

// Fetcher function - 处理 Laravel Resource Collection 返回格式
const fetcher = async <T>(url: string): Promise<T> => {
  try {
    const response = await get<any>(url)

    // Laravel Resource Collection 返回格式是 {data: [...]}
    // 如果是对象且有 data 属性且是数组，返回 data
    if (response && typeof response === 'object' && 'data' in response) {
      if (Array.isArray(response.data)) {
        return response.data as T
      }
      // 如果是单个资源对象，直接返回 data
      return response.data as T
    }

    // 如果直接是数组，直接返回
    if (Array.isArray(response)) {
      return response as T
    }

    return response as T
  } catch (error) {
    console.error('Word API 请求失败:', error)
    throw error
  }
}

// 单词书相关 hooks
export const useBooks = () => useSWR<Book[]>('/word/books', fetcher)

export const useBook = (id: number) => useSWR<Book>(id ? `/word/books/${id}` : null, fetcher)

export type WordFilter = 'all' | 'mastered' | 'difficult' | 'simple'

export const useBookWords = (
  bookId: number | null | undefined,
  page = 1,
  perPage = 20,
  filter: WordFilter = 'all'
) =>
  useSWR<{ data: Word[]; meta: { current_page: number; last_page: number; total: number } }>(
    bookId ? `/word/books/${bookId}/words?page=${page}&per_page=${perPage}&filter=${filter}` : null,
    async (url: string) => {
      const response = await get<any>(url)
      return response
    }
  )

// 无限滚动 hook
export const useBookWordsInfinite = (
  bookId: number | null | undefined,
  perPage = 30,
  filter: WordFilter = 'all'
) => {
  const getKey = (
    pageIndex: number,
    previousPageData: { data: Word[]; meta: { last_page: number } } | null
  ) => {
    if (!bookId) return null
    if (previousPageData && pageIndex + 1 > previousPageData.meta.last_page) return null
    return `/word/books/${bookId}/words?page=${pageIndex + 1}&per_page=${perPage}&filter=${filter}`
  }

  const { data, error, isLoading, isValidating, size, setSize } = useSWRInfinite<{
    data: Word[]
    meta: { current_page: number; last_page: number; total: number }
  }>(getKey, async (url: string) => {
    const response = await get<any>(url)
    return response
  })

  const words = data ? data.flatMap(page => page.data) : []
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined')
  const isEmpty = data?.[0]?.data?.length === 0
  const isReachingEnd =
    isEmpty ||
    (data && data[data.length - 1]?.meta.current_page >= data[data.length - 1]?.meta.last_page)
  const total = data?.[0]?.meta?.total ?? 0

  return {
    words,
    error,
    isLoading,
    isLoadingMore,
    isValidating,
    isEmpty,
    isReachingEnd,
    total,
    size,
    setSize,
    loadMore: () => setSize(size + 1),
  }
}

// 学习相关 hooks
export const useDailyWords = () => useSWR<Word[]>('/word/daily', fetcher)

export const useReviewWords = () => useSWR<Word[]>('/word/review', fetcher)

export const useWordProgress = () => useSWR<WordProgress>('/word/progress', fetcher)

// 打卡相关 hooks
export const useCheckInCalendar = (year: number, month: number) =>
  useSWR<CalendarData>(`/word/calendar/${year}/${month}`, fetcher)

// 获取整年日历
export const useYearCheckInCalendar = (year: number) =>
  useSWR<YearCalendarData>(`/word/calendar/year/${year}`, fetcher)

// 获取最近 365 天日历
export const useLast365CheckInCalendar = () =>
  useSWR<RangeCalendarData>(`/word/calendar/last365`, fetcher)

export const useWordStats = () => useSWR<WordStats>('/word/stats', fetcher)

// 设置相关 hooks
export const useWordSettings = () => useSWR<UserWordSetting>('/word/settings', fetcher)

// Mutation functions
export const markWord = async (wordId: number, remembered: boolean) => {
  return post<{ message: string }>(`/word/mark/${wordId}`, { remembered })
}

export const markWordAsSimple = async (wordId: number) => {
  return post<{ message: string }>(`/word/simple/${wordId}`, {})
}

/** 获取用户本地日期 YYYY-MM-DD，用于打卡避免服务端 UTC 导致跨日显示错误 */
function getLocalDateString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const checkIn = async () => {
  return post<{ message: string; check_in: unknown }>('/word/check-in', {
    local_date: getLocalDateString(),
  })
}

export const updateWordSettings = async (settings: Partial<UserWordSetting>) => {
  return put<{ message: string; setting: UserWordSetting }>('/word/settings', settings)
}
