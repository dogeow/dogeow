'use client'

import { useEffect, useState, useCallback } from 'react'
import { getEchoInstance, createEchoInstance } from '@/lib/websocket'

/**
 * 知识库索引状态：打开时请求一次更新时间，并订阅 Reverb 实时更新。
 * @param enabled 是否启用（弹窗打开且为知识库模式时为 true）
 */
export function useKnowledgeIndexStatus(enabled: boolean) {
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  const fetchOnce = useCallback(async () => {
    try {
      const res = await fetch('/api/knowledge/build-index')
      const data = await res.json()
      if (data.exists && data.updatedAt) setUpdatedAt(data.updatedAt)
    } catch {
      // 忽略错误，仅依赖后续 WebSocket 更新
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    const id = setTimeout(() => {
      fetchOnce()
    }, 0)
    return () => clearTimeout(id)
  }, [enabled, fetchOnce])

  useEffect(() => {
    if (!enabled) return
    const echo = getEchoInstance() ?? createEchoInstance()
    if (!echo) return
    const channel = echo.channel('knowledge-index')
    channel.listen('.knowledge.index.updated', (e: { updated_at?: string }) => {
      if (e?.updated_at) setUpdatedAt(e.updated_at)
    })
    return () => {
      echo.leave('knowledge-index')
    }
  }, [enabled])

  return { updatedAt: enabled ? updatedAt : null }
}
