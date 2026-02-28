'use client'

import { useState, useRef, useEffect } from 'react'
import useSWR from 'swr'
import { get, post } from '@/lib/api'
import type { UnreadNotificationsResponse } from '@/lib/api'
import useAuthStore from '@/stores/authStore'
import { Bell } from 'lucide-react'
import { toast } from 'sonner'

const fetcher = (url: string) => get<UnreadNotificationsResponse>(url)

export function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const ref = useRef<HTMLDivElement>(null)

  const { data, mutate } = useSWR<UnreadNotificationsResponse>(
    isAuthenticated ? 'notifications/unread' : null,
    fetcher,
    {
      revalidateOnMount: false,
    }
  )

  // 点击外部关闭
  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  // 打开下拉时主动刷新一次，确保列表和角标是最新
  useEffect(() => {
    if (!open || !isAuthenticated) return
    void mutate()
  }, [open, isAuthenticated, mutate])

  const handleMarkRead = async (id: string, url: string) => {
    try {
      await post<{ message: string }>(`notifications/${id}/read`, {})
      mutate()
      // 跳转
      window.location.assign(url)
      setOpen(false)
    } catch {
      toast.error('标记已读失败')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await post<{ message: string }>('notifications/read-all', {})
      mutate()
      toast.success('已全部标记为已读')
      setOpen(false)
    } catch {
      toast.error('标记失败')
    }
  }

  const count = data?.count ?? 0

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="hover:bg-muted relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
        aria-label="通知"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="bg-destructive text-white absolute -top-px -right-px flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-1 text-[9px] font-medium leading-none">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="bg-background border-border absolute right-0 top-full z-[100] mt-2 w-80 rounded-lg border shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="font-medium">通知</span>
            {count > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                全部已读
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {!data || data.items.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center text-sm">暂无未读通知</div>
            ) : (
              data.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleMarkRead(item.id, item.data.url || '/')}
                  className="hover:bg-muted flex w-full flex-col items-start gap-1 border-b px-4 py-3 text-left last:border-0"
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-medium">{item.data.title || '通知'}</span>
                  </div>
                  {item.data.body && (
                    <span className="text-muted-foreground line-clamp-2 text-sm">
                      {item.data.body}
                    </span>
                  )}
                  <span className="text-muted-foreground text-xs">
                    {new Date(item.created_at).toLocaleString('zh-CN')}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
