'use client'

import { useMemo } from 'react'
import { Server, Activity, ListTodo, Database, Layers, Wifi, Clock } from 'lucide-react'
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
      name: '小龙虾🦞',
      status: normalizeStatus(data.openclaw.status),
      lastCheck,
      icon: <Server className={iconClass} />,
      description: 'OpenClaw 应用服务器',
      details: data.openclaw.details || undefined,
    },
    {
      name: '数据库',
      status: normalizeStatus(data.database.status),
      lastCheck,
      icon: <Database className={iconClass} />,
      description: 'MySQL 数据库',
      details: data.database.details || undefined,
    },
    {
      name: 'Redis',
      status: normalizeStatus(data.redis.status),
      lastCheck,
      icon: <Layers className={iconClass} />,
      description: 'Redis 缓存服务',
      details: data.redis.details || undefined,
    },
    {
      name: 'CDN',
      status: normalizeStatus(data.cdn.status),
      lastCheck,
      icon: <Wifi className={iconClass} />,
      description: '又拍云 CDN',
      details: data.cdn.details || undefined,
    },
    {
      name: 'Reverb',
      status: normalizeStatus(data.reverb.status),
      lastCheck,
      icon: <Activity className={iconClass} />,
      description: 'Laravel Reverb WebSocket',
      details: data.reverb.details || undefined,
    },
    {
      name: '队列',
      status: normalizeStatus(data.queue.status),
      lastCheck,
      icon: <ListTodo className={iconClass} />,
      description: 'Laravel 队列 Worker',
      details: data.queue.details || undefined,
    },
    {
      name: '调度器',
      status: normalizeStatus(data.scheduler.status),
      lastCheck,
      icon: <Clock className={iconClass} />,
      description: 'Laravel 任务调度',
      details: data.scheduler.details || undefined,
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
      description: 'OpenClaw 应用服务器',
      details: message,
    },
    {
      name: '数据库',
      status,
      lastCheck,
      icon: <Database className={iconClass} />,
      description: 'MySQL 数据库',
      details: message,
    },
    {
      name: 'Redis',
      status,
      lastCheck,
      icon: <Layers className={iconClass} />,
      description: 'Redis 缓存服务',
      details: message,
    },
    {
      name: 'CDN',
      status,
      lastCheck,
      icon: <Wifi className={iconClass} />,
      description: '又拍云 CDN',
      details: message,
    },
    {
      name: 'Reverb',
      status,
      lastCheck,
      icon: <Activity className={iconClass} />,
      description: 'Laravel Reverb WebSocket',
      details: message,
    },
    {
      name: '队列',
      status,
      lastCheck,
      icon: <ListTodo className={iconClass} />,
      description: 'Laravel 队列 Worker',
      details: message,
    },
    {
      name: '调度器',
      status,
      lastCheck,
      icon: <Clock className={iconClass} />,
      description: 'Laravel 任务调度',
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
