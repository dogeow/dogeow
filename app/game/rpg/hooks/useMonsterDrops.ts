'use client'

import useSWR from 'swr'
import { apiGet } from '@/lib/api'
import type { CompendiumMonsterDrops } from '../types'

const fetcher = async (url: string): Promise<CompendiumMonsterDrops> => {
  return (await apiGet(url)) as CompendiumMonsterDrops
}

/**
 * 获取怪物掉落数据的 hook，使用 SWR 缓存 5 分钟
 */
export function useMonsterDrops(monsterId: number | null | undefined) {
  const shouldFetch = monsterId != null
  const key = shouldFetch ? `/rpg/compendium/monsters/${monsterId}/drops` : null

  const { data, error, isLoading } = useSWR(key, fetcher, {
    dedupingInterval: 5 * 60 * 1000, // 5 分钟内相同请求去重
    revalidateOnFocus: false, // 窗口聚焦时不重新验证
    revalidateOnReconnect: false, // 网络重连时不重新验证
  })

  return {
    data: data ?? null,
    error,
    isLoading,
  }
}
