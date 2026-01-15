'use client'

import React, { useMemo, useState } from 'react'
import {
  Calendar,
  Tag,
  User,
  GitBranch,
  Star,
  Bug,
  Zap,
  BookOpen,
  MessageSquare,
  Server,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
} from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface DevLogEntry {
  id: string
  date: Date
  version?: string
  type: 'feature' | 'bugfix' | 'update' | 'release' | 'milestone'
  title: string
  description: string
  author?: string
  tags?: string[]
}

interface SystemStatus {
  name: string
  status: 'online' | 'offline' | 'warning' | 'error'
  lastCheck: Date
  icon: React.ReactNode
  description: string
  details?: string
}

const DevLogItem: React.FC<{ log: DevLogEntry; t: (key: string, fallback?: string) => string }> = ({
  log,
  t,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const neutralTypeConfig = {
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-900/40',
    borderColor: 'border-gray-200 dark:border-gray-800',
    badgeColor:
      'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  }

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'feature':
        return {
          ...neutralTypeConfig,
          icon: <Zap className="h-4 w-4 text-gray-600 dark:text-gray-400" />,
          label: t('devlog.type.feature', '新功能'),
        }
      case 'bugfix':
        return {
          ...neutralTypeConfig,
          icon: <Bug className="h-4 w-4 text-gray-600 dark:text-gray-400" />,
          label: t('devlog.type.bugfix', '修复'),
        }
      case 'update':
        return {
          ...neutralTypeConfig,
          icon: <BookOpen className="h-4 w-4 text-gray-600 dark:text-gray-400" />,
          label: t('devlog.type.update', '更新'),
        }
      case 'release':
        return {
          ...neutralTypeConfig,
          icon: <GitBranch className="h-4 w-4 text-gray-600 dark:text-gray-400" />,
          label: t('devlog.type.release', '发布'),
        }
      case 'milestone':
        return {
          ...neutralTypeConfig,
          icon: <Star className="h-4 w-4 text-gray-600 dark:text-gray-400" />,
          label: t('devlog.type.milestone', '里程碑'),
        }
      default:
        return {
          ...neutralTypeConfig,
          icon: <BookOpen className="h-4 w-4 text-gray-600 dark:text-gray-400" />,
          label: t('devlog.type.update', '更新'),
        }
    }
  }

  const config = getTypeConfig(log.type)

  return (
    <div className="border-b border-gray-100 last:border-b-0 dark:border-gray-800">
      <div
        className="flex cursor-pointer flex-col gap-3 px-4 py-3 transition-colors hover:bg-gray-50 sm:flex-row sm:items-center dark:hover:bg-gray-900/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {config.icon}

          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={`text-xs font-medium ${config.badgeColor}`}>
                {config.label}
              </Badge>
              {log.version && (
                <Badge
                  variant="outline"
                  className="border-gray-300 bg-gray-100 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                >
                  v{log.version}
                </Badge>
              )}
            </div>
            <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
              {log.title}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
            <Calendar className="h-3 w-3" />
            <span>{log.date.toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className={`${config.bgColor} border-t px-4 py-3 ${config.borderColor}`}>
          <div className="mb-3 text-sm text-gray-700 dark:text-gray-300">{log.description}</div>

          <div className="flex flex-col gap-4 text-xs text-gray-600 sm:flex-row sm:items-center dark:text-gray-400">
            {log.author && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{log.author}</span>
              </div>
            )}

            {log.tags && log.tags.length > 0 && (
              <div className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                <div className="flex flex-wrap gap-1">
                  {log.tags.map(tag => (
                    <span
                      key={tag}
                      className="rounded bg-gray-200 px-1.5 py-0.5 text-xs dark:bg-gray-700 dark:text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const SystemStatusItem: React.FC<{ status: SystemStatus }> = ({ status }) => {
  const neutralStatusConfig = {
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-900/40',
    borderColor: 'border-gray-200 dark:border-gray-800',
    badgeColor:
      'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'online':
        return {
          ...neutralStatusConfig,
          icon: <CheckCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />,
          label: '在线',
        }
      case 'warning':
        return {
          ...neutralStatusConfig,
          icon: <AlertCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />,
          label: '警告',
        }
      case 'error':
        return {
          ...neutralStatusConfig,
          icon: <XCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />,
          label: '错误',
        }
      default:
        return {
          ...neutralStatusConfig,
          icon: <XCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />,
          label: '离线',
        }
    }
  }

  const config = getStatusConfig(status.status)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {status.icon}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">{status.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{status.description}</p>
            {status.details && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">{status.details}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Badge variant="outline" className={`text-xs font-medium ${config.badgeColor}`}>
            {config.label}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="h-3 w-3" />
            <span>{status.lastCheck.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const SiteLogTree: React.FC = () => {
  const { t } = useTranslation()
  const [selectedType, setSelectedType] = useState<string>('all')

  // 开发日志数据 - 按时间倒序排列
  const [logs] = useState<DevLogEntry[]>([
    {
      id: '1',
      date: new Date('2024-01-15'),
      version: '1.2.0',
      type: 'release',
      title: '多语言支持正式发布',
      description:
        '完成了完整的多语言支持功能，包括简体中文、繁體中文、英文和日文。用户现在可以自由切换界面语言，所有主要功能都已本地化。',
      author: '小李世界',
      tags: ['i18n', '国际化', '用户体验'],
    },
    {
      id: '2',
      date: new Date('2024-01-10'),
      version: '1.1.5',
      type: 'update',
      title: '站点日志页面重新设计',
      description:
        '将站点日志从系统监控日志改为开发日志，记录网站的开发历程、功能更新和重要里程碑。',
      author: '小李世界',
      tags: ['设计', '用户体验'],
    },
    {
      id: '3',
      date: new Date('2024-01-08'),
      version: '1.1.0',
      type: 'milestone',
      title: '游戏模块完成',
      description:
        '完成了所有游戏模块的开发，包括俄罗斯方块、2048、贪吃蛇、扫雷等经典游戏，支持移动端操作。',
      author: '小李世界',
      tags: ['游戏', '移动端', '里程碑'],
    },
    {
      id: '4',
      date: new Date('2024-01-05'),
      version: '1.0.8',
      type: 'bugfix',
      title: '修复主题切换问题',
      description: '修复了深色模式切换时的闪烁问题，优化了主题切换的用户体验。',
      author: '小李世界',
      tags: ['修复', '主题', 'UI'],
    },
    {
      id: '5',
      date: new Date('2024-01-01'),
      version: '1.0.0',
      type: 'milestone',
      title: '网站正式上线',
      description: 'DogeOw网站正式上线，包含物品管理、文件管理、笔记、导航等核心功能模块。',
      author: '小李世界',
      tags: ['上线', '里程碑', '核心功能'],
    },
  ])

  const systemBaseTime = useMemo(() => new Date(), [])

  // 系统状态数据
  const systemStatus = useMemo<SystemStatus[]>(
    () => [
      {
        name: '聊天室',
        status: 'online',
        lastCheck: new Date(systemBaseTime),
        icon: <MessageSquare className="h-5 w-5 text-gray-600 dark:text-gray-400" />,
        description: 'WebSocket 实时聊天服务',
        details: '连接数: 12 | 消息/分钟: 45',
      },
      {
        name: '队列系统',
        status: 'online',
        lastCheck: new Date(systemBaseTime.getTime() - 30000), // 30秒前
        icon: <Server className="h-5 w-5 text-gray-600 dark:text-gray-400" />,
        description: 'Laravel Horizon 队列处理',
        details: '活跃队列: 3 | 待处理任务: 5',
      },
      {
        name: 'Octane 服务',
        status: 'online',
        lastCheck: new Date(systemBaseTime.getTime() - 60000), // 1分钟前
        icon: <Activity className="h-5 w-5 text-gray-600 dark:text-gray-400" />,
        description: 'Laravel Octane 高性能服务',
        details: '内存使用: 128MB | 请求/秒: 156',
      },
      {
        name: '数据库',
        status: 'warning',
        lastCheck: new Date(systemBaseTime.getTime() - 120000), // 2分钟前
        icon: <Server className="h-5 w-5 text-gray-600 dark:text-gray-400" />,
        description: 'MySQL 数据库连接',
        details: '连接池: 85% | 慢查询: 2',
      },
      {
        name: '缓存服务',
        status: 'online',
        lastCheck: new Date(systemBaseTime.getTime() - 45000), // 45秒前
        icon: <Activity className="h-5 w-5 text-gray-600 dark:text-gray-400" />,
        description: 'Redis 缓存服务',
        details: '命中率: 94% | 内存使用: 256MB',
      },
    ],
    [systemBaseTime]
  )

  const filteredLogs = selectedType === 'all' ? logs : logs.filter(log => log.type === selectedType)

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6">
      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="logs">网站日志</TabsTrigger>
          <TabsTrigger value="status">网站状态</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="mt-6">
          <Card className="border-0 bg-white shadow-lg dark:border-gray-800 dark:bg-neutral-900">
            <CardHeader className="border-b border-gray-200 bg-neutral-50 dark:border-gray-700 dark:bg-neutral-900/60">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100">
                    <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    {t('devlog.title', '开发日志')}
                  </CardTitle>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {t('devlog.subtitle', '记录网站的开发历程、功能更新和重要里程碑')}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="text-sm font-medium whitespace-nowrap text-gray-700 dark:text-gray-300">
                  {t('devlog.filter.label', '筛选:')}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedType('all')}
                    className={
                      selectedType === 'all'
                        ? 'border-gray-900 bg-gray-900 text-white hover:bg-gray-800 dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200'
                        : 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }
                  >
                    {t('devlog.filter.all', '全部')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedType('feature')}
                    className={
                      selectedType === 'feature'
                        ? 'border-gray-900 bg-gray-900 text-white hover:bg-gray-800 dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200'
                        : 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }
                  >
                    {t('devlog.type.feature', '新功能')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedType('bugfix')}
                    className={
                      selectedType === 'bugfix'
                        ? 'border-gray-900 bg-gray-900 text-white hover:bg-gray-800 dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200'
                        : 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }
                  >
                    {t('devlog.type.bugfix', '修复')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedType('update')}
                    className={
                      selectedType === 'update'
                        ? 'border-gray-900 bg-gray-900 text-white hover:bg-gray-800 dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200'
                        : 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }
                  >
                    {t('devlog.type.update', '更新')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedType('release')}
                    className={
                      selectedType === 'release'
                        ? 'border-gray-900 bg-gray-900 text-white hover:bg-gray-800 dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200'
                        : 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }
                  >
                    {t('devlog.type.release', '发布')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedType('milestone')}
                    className={
                      selectedType === 'milestone'
                        ? 'border-gray-900 bg-gray-900 text-white hover:bg-gray-800 dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200'
                        : 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }
                  >
                    {t('devlog.type.milestone', '里程碑')}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                {filteredLogs.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                    <BookOpen className="mr-2 h-8 w-8" />
                    {t('devlog.no_results', '没有找到符合条件的日志')}
                  </div>
                ) : (
                  filteredLogs.map(log => <DevLogItem key={log.id} log={log} t={t} />)
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="mt-6">
          <Card className="border-0 bg-white shadow-lg dark:border-gray-800 dark:bg-neutral-900">
            <CardHeader className="border-b border-gray-200 bg-neutral-50 dark:border-gray-700 dark:bg-neutral-900/60">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100">
                <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
                网站状态
              </CardTitle>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                实时监控网站各项服务的运行状态和性能指标
              </p>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {systemStatus.map((status, index) => (
                  <SystemStatusItem key={index} status={status} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SiteLogTree
