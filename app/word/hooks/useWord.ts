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

// 无限滚动 hook（keyword 为空时不传，避免影响缓存 key 一致性）
export const useBookWordsInfinite = (
  bookId: number | null | undefined,
  perPage = 30,
  filter: WordFilter = 'all',
  keyword?: string
) => {
  const search = keyword?.trim() ?? ''
  const getKey = (
    pageIndex: number,
    previousPageData: { data: Word[]; meta: { last_page: number } } | null
  ) => {
    if (!bookId) return null
    if (previousPageData && pageIndex + 1 > previousPageData.meta.last_page) return null
    const base = `/word/books/${bookId}/words?page=${pageIndex + 1}&per_page=${perPage}&filter=${filter}`
    return search ? `${base}&keyword=${encodeURIComponent(search)}` : base
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

export const useFillBlankWords = () => useSWR<Word[]>('/word/fill-blank', fetcher)

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

// 搜索单词
export const searchWord = async (keyword: string) => {
  return get<{ found: boolean; word?: Word; keyword?: string }>(`/word/search/${keyword}`)
}

// 教育级别名称 -> 后端 code 映射（供 WordDataEditor 等解析阶段用）
export const EDUCATION_LEVEL_NAME_TO_CODE: Record<string, string> = {
  小学: 'primary',
  初中: 'junior_high',
  高中: 'senior_high',
  CET4: 'cet4',
  CET6: 'cet6',
  考研: 'postgraduate',
  雅思: 'ielts',
  托福: 'toefl',
  专四: 'tem4',
  专八: 'tem8',
}
const VALID_CODES = new Set(Object.values(EDUCATION_LEVEL_NAME_TO_CODE))

/** 将阶段名称字符串解析为后端 code 数组 */
export function parseEducationLevelNames(namesStr: string): string[] {
  const names = namesStr
    .split(/[,，]/)
    .map(s => s.trim())
    .filter(Boolean)
  const codes = names
    .map(n => EDUCATION_LEVEL_NAME_TO_CODE[n] ?? (VALID_CODES.has(n) ? n : null))
    .filter((c): c is string => c != null)
  return [...new Set(codes)]
}

/** code -> 显示名称映射（供显示用） */
export const EDUCATION_LEVEL_CODE_TO_NAME: Record<string, string> = {
  primary: '小学',
  junior_high: '初中',
  senior_high: '高中',
  cet4: 'CET4',
  cet6: 'CET6',
  postgraduate: '考研',
  ielts: '雅思',
  toefl: '托福',
  tem4: '专四',
  tem8: '专八',
}

/** 将 code 数组转换为显示名称数组 */
export function getEducationLevelNames(codes: string[]): string[] {
  return codes.map(c => EDUCATION_LEVEL_CODE_TO_NAME[c] ?? c).filter(Boolean)
}

/** 用 AI 判断单词所属教育级别，返回后端使用的 code 数组 */
export async function classifyWordEducationLevel(word: string): Promise<string[]> {
  const prompt = `判断英语单词 "${word}" 属于以下哪个学习阶段？只返回阶段名称，多个用逗号分隔：小学、初中、高中、CET4、CET6、考研、雅思、托福、专四、专八。只返回上述名称，不要其他内容。`
  const body = {
    useChat: true,
    messages: [{ role: 'user' as const, content: prompt }],
    command: '你是一个英语学习助手。只返回阶段名称，多个用逗号分隔。',
  }
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error('AI 判断失败')
  const reader = response.body?.getReader()
  if (!reader) throw new Error('无法读取响应')
  let content = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const text = new TextDecoder().decode(value)
    const lines = text.split('\n').filter(line => line.trim())
    for (const line of lines) {
      if (line.startsWith('0:')) {
        const match = line.match(/^0:"(.*)"$/)
        if (match) {
          content += match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
        }
      }
    }
  }
  return parseEducationLevelNames(content)
}

// 创建新单词（可传 education_level_codes，由 AI 判断后加入对应级别单词书）
export const createWord = async (data: {
  content: string
  phonetic_us?: string
  explanation?: string
  example_sentences?: Array<{ en: string; zh: string }>
  education_level_codes?: string[]
}) => {
  return post<{ word: Word }>('/word/create', data)
}
