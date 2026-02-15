import { get } from '@/lib/api'
import { createSearchResult, searchLocalData } from '../utils/searchLocalData'
import type { SearchResult } from '../types'

/**
 * 搜索 API 响应类型
 */
export interface SearchApiResponse {
  results: Array<{
    id: number
    name: string
    description?: string
    is_public?: boolean
    user_id?: number
    thumbnail_url?: string | null
  }>
  user_authenticated: boolean
}

/**
 * 搜索参数
 */
export interface SearchParams {
  query: string
  category?: string
}

/**
 * 搜索远程数据（数据库）
 */
export async function searchRemoteData(
  query: string,
  category: string,
  isAuthenticated: boolean
): Promise<SearchResult[]> {
  // 只有 thing 分类有后端 API
  if (category !== 'all' && category !== 'thing') {
    return []
  }

  try {
    const response = await get<SearchApiResponse>(`/things/search?q=${encodeURIComponent(query)}`)

    if (!response.results?.length) {
      return []
    }

    return response.results.map(item =>
      createSearchResult(item, 'thing', `/thing/${item.id}`, {
        requireAuth: false,
        isPublic: item.is_public,
        thumbnailUrl: item.thumbnail_url,
      })
    )
  } catch {
    // 静默处理错误，不影响本地搜索结果
    return []
  }
}

/**
 * 执行全站搜索
 */
export interface FullSearchParams {
  query: string
  category: string
  isAuthenticated: boolean
  t: (key: string) => string
}

export async function performFullSearch({
  query,
  category,
  isAuthenticated,
  t,
}: FullSearchParams): Promise<SearchResult[]> {
  const results: SearchResult[] = []

  // 搜索本地数据
  const localResults = searchLocalData(query, category, isAuthenticated, t)
  results.push(...localResults)

  // 搜索远程数据（需要认证）
  const remoteResults = await searchRemoteData(query, category, isAuthenticated)
  results.push(...remoteResults)

  return results
}
