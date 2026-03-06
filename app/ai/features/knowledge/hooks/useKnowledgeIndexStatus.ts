'use client'

import { useEffect } from 'react'
import useSWR from 'swr'
import { getEchoInstance, createEchoInstance } from '@/lib/websocket'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  const data = await res.json()
  return data.exists && data.updatedAt ? (data.updatedAt as string) : null
}

/**
 * 知识库索引状态：打开时请求一次更新时间，并订阅 Reverb 实时更新。
 * @param enabled 是否启用（弹窗打开且为知识库模式时为 true）
 */
export function useKnowledgeIndexStatus(enabled: boolean) {
  const { data: updatedAt, mutate } = useSWR(
    enabled ? '/api/knowledge/build-index' : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  useEffect(() => {
    if (!enabled) return
    const echo = getEchoInstance() ?? createEchoInstance()
    if (!echo) return
    const channel = echo.channel('knowledge-index')
    channel.listen('.knowledge.index.updated', (e: { updated_at?: string }) => {
      if (e?.updated_at) mutate(e.updated_at, false)
    })
    return () => {
      echo.leave('knowledge-index')
    }
  }, [enabled, mutate])

  return { updatedAt: enabled ? (updatedAt ?? null) : null }
}
