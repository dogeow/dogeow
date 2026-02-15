import { getTranslatedConfigs } from '@/app/configs'
import type { SearchResult } from '../types'

/**
 * 本地数据源配置
 */
interface LocalDataSource {
  category: string
  requireAuth: boolean
  getData: (configs: ReturnType<typeof getTranslatedConfigs>) => Array<{
    id: string | number
    name?: string
    description?: string
    url?: string
  }>
}

/**
 * 本地数据源列表
 */
const localDataSources: LocalDataSource[] = [
  {
    category: 'game',
    requireAuth: false,
    getData: configs => configs.games,
  },
  {
    category: 'nav',
    requireAuth: true,
    getData: configs => configs.navigation,
  },
  {
    category: 'note',
    requireAuth: true,
    getData: configs => configs.notes,
  },
  {
    category: 'file',
    requireAuth: true,
    getData: configs => configs.files,
  },
  {
    category: 'lab',
    requireAuth: false,
    getData: configs => configs.lab,
  },
]

/**
 * 搜索本地数据
 */
export function searchLocalData(
  searchTerm: string,
  category: string,
  isAuthenticated: boolean,
  t: (key: string) => string
): SearchResult[] {
  if (!searchTerm.trim()) {
    return []
  }

  const results: SearchResult[] = []
  const lowerSearchTerm = searchTerm.toLowerCase()
  const translatedConfigs = getTranslatedConfigs(t)

  // 过滤需要认证的数据源
  const availableSources = localDataSources.filter(source => !source.requireAuth || isAuthenticated)

  // 处理每个数据源
  for (const source of availableSources) {
    // 检查是否匹配当前分类（all 或特定分类）
    if (category !== 'all' && category !== source.category) {
      continue
    }

    const data = source.getData(translatedConfigs)

    const matchedItems = data.filter(item => {
      const name = String(item.name ?? '').toLowerCase()
      const description = String(item.description ?? '').toLowerCase()
      const id = String(item.id ?? '').toLowerCase()

      return (
        name.includes(lowerSearchTerm) ||
        description.includes(lowerSearchTerm) ||
        id.includes(lowerSearchTerm)
      )
    })

    const mappedResults: SearchResult[] = matchedItems
      .filter(item => item.id && item.name && item.description)
      .map(item => ({
        id: item.id!,
        title: item.name!,
        content: item.description!,
        url: item.url ?? `/${source.category}/${item.id}`,
        category: source.category,
        requireAuth: source.requireAuth,
      }))

    results.push(...mappedResults)
  }

  return results
}

/**
 * 创建搜索结果
 */
export function createSearchResult<
  T extends { id: string | number; name?: string; description?: string },
>(
  item: T,
  category: string,
  url?: string,
  options?: {
    requireAuth?: boolean
    isPublic?: boolean
    thumbnailUrl?: string | null
  }
): SearchResult {
  return {
    id: item.id,
    title: item.name ?? '',
    content: item.description ?? '',
    url: url ?? `/${category}/${item.id}`,
    category,
    requireAuth: options?.requireAuth ?? false,
    isPublic: options?.isPublic,
    thumbnail_url: options?.thumbnailUrl,
  }
}
