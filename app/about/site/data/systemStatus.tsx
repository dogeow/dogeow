'use client'

import { useMemo } from 'react'
import { Server, Activity, ListTodo } from 'lucide-react'
import useSWR from 'swr'
import { apiRequest } from '@/lib/api'
import type { SystemStatus } from '../types'
import type { SystemStatusApiResponse } from '../types-api'

const STATUS_KEY = 'system/status'
const REFRESH_INTERVAL_MS = 12_000

type StatusKind = 'online' | 'offline' | 'warning' | 'error'

function normalizeStatus(s: string): StatusKind {
  if (s === 'online') return 'online'
  if (s === 'offline') return 'offline'
  if (s === 'warning') return 'warning'
  return 'error'
}

function mapApiToSystemStatus(data: SystemStatusApiResponse, lastCheck: Date): SystemStatus[] {
  const iconClass = 'h-5 w-5 text-gray-600 dark:text-gray-400'
  return [
    {
      name: 'OpenClaw 服务器',
      status: normalizeStatus(data.openclaw.status),
      lastCheck,
      icon: <Server className={iconClass} />,
      description: 'OpenClaw 应用服务器（CPU / 内存 / 磁盘）',
      details: data.openclaw.details || undefined,
    },
    {
      name: 'Reverb',
      status: normalizeStatus(data.reverb.status),
      lastCheck,
      icon: <Activity className={iconClass} />,
      description: 'Laravel Reverb WebSocket 服务',
      details: data.reverb.details || undefined,
    },
    {
      name: '队列',
      status: normalizeStatus(data.queue.status),
      lastCheck,
      icon: <ListTodo className={iconClass} />,
      description: 'Laravel 队列 Worker（Supervisor）',
      details: data.queue.details || undefined,
    },
  ]
}

function fallbackStatuses(
  message: string,
  lastCheck: Date,
  isError: boolean = true
): SystemStatus[] {
  const iconClass = 'h-5 w-5 text-gray-600 dark:text-gray-400'
  const status: StatusKind = isError ? 'error' : 'online'
  return [
    {
      name: 'OpenClaw 服务器',
      status,
      lastCheck,
      icon: <Server className={iconClass} />,
      description: 'OpenClaw 应用服务器（CPU / 内存 / 磁盘）',
      details: message,
    },
    {
      name: 'Reverb',
      status,
      lastCheck,
      icon: <Activity className={iconClass} />,
      description: 'Laravel Reverb WebSocket 服务',
      details: message,
    },
    {
      name: '队列',
      status,
      lastCheck,
      icon: <ListTodo className={iconClass} />,
      description: 'Laravel 队列 Worker（Supervisor）',
      details: message,
    },
  ]
}

const fetcher = (endpoint: string) =>
  apiRequest<SystemStatusApiResponse>(endpoint, 'GET', undefined, { handleError: false })

export const useSystemStatus = (): SystemStatus[] => {
  const { data, error, isLoading } = useSWR<SystemStatusApiResponse>(STATUS_KEY, fetcher, {
    refreshInterval: REFRESH_INTERVAL_MS,
    revalidateOnFocus: false,
  })

  return useMemo(() => {
    const lastCheck = new Date()
    if (error) {
      return fallbackStatuses(
        error instanceof Error ? error.message : '获取状态失败，请稍后刷新',
        lastCheck,
        true
      )
    }
    if (isLoading || !data) {
      return fallbackStatuses('加载中…', lastCheck, false)
    }
    return mapApiToSystemStatus(data, lastCheck)
  }, [data, error, isLoading])
}
