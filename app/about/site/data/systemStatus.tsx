import { useMemo } from 'react'
import { MessageSquare, Server, Activity } from 'lucide-react'
import type { SystemStatus } from '../types'

export const useSystemStatus = (): SystemStatus[] => {
  const systemBaseTime = useMemo(() => new Date(), [])

  return useMemo<SystemStatus[]>(
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
}
