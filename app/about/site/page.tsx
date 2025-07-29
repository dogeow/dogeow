'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface LogEntry {
  id: string
  timestamp: Date
  level: 'info' | 'warning' | 'error'
  message: string
  details?: string
  children?: LogEntry[]
}

interface TreeNodeProps {
  log: LogEntry
  depth?: number
}

const TreeNode: React.FC<TreeNodeProps> = ({ log, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-600'
      case 'warning':
        return 'text-yellow-600'
      case 'info':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="select-none">
      <div
        className={`flex cursor-pointer items-center px-2 py-2 hover:bg-gray-50`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {log.children && log.children.length > 0 && (
          <span className="mr-2">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
        )}
        <span className="mr-3 text-xs text-gray-500">{log.timestamp.toLocaleString()}</span>
        <span className={`mr-2 text-xs font-medium ${getLevelColor(log.level)}`}>
          [{log.level.toUpperCase()}]
        </span>
        <span className="text-sm">{log.message}</span>
      </div>

      {log.details && isExpanded && (
        <div
          className="bg-gray-50 px-2 py-1 text-xs text-gray-600"
          style={{ paddingLeft: `${depth * 20 + 32}px` }}
        >
          {log.details}
        </div>
      )}

      {isExpanded && log.children && (
        <div>
          {log.children.map(child => (
            <TreeNode key={child.id} log={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

const SiteLogTree: React.FC = () => {
  // 示例数据 - 按最新到最旧排序
  const [logs] = useState<LogEntry[]>([
    {
      id: '1',
      timestamp: new Date('2024-01-15T10:30:00'),
      level: 'error',
      message: '服务器连接失败',
      details: 'Connection timeout after 30 seconds',
      children: [
        {
          id: '1-1',
          timestamp: new Date('2024-01-15T10:29:45'),
          level: 'warning',
          message: '重试连接中...',
        },
        {
          id: '1-2',
          timestamp: new Date('2024-01-15T10:29:30'),
          level: 'info',
          message: '初始连接尝试',
        },
      ],
    },
    {
      id: '2',
      timestamp: new Date('2024-01-15T09:15:22'),
      level: 'info',
      message: '用户登录成功',
      details: 'User: admin@example.com',
      children: [
        {
          id: '2-1',
          timestamp: new Date('2024-01-15T09:15:20'),
          level: 'info',
          message: '验证用户凭据',
        },
        {
          id: '2-2',
          timestamp: new Date('2024-01-15T09:15:18'),
          level: 'info',
          message: '接收登录请求',
        },
      ],
    },
    {
      id: '3',
      timestamp: new Date('2024-01-15T08:45:10'),
      level: 'warning',
      message: '磁盘空间不足',
      details: '可用空间: 2.1GB / 100GB',
    },
    {
      id: '4',
      timestamp: new Date('2024-01-15T08:00:00'),
      level: 'info',
      message: '系统启动完成',
      children: [
        {
          id: '4-1',
          timestamp: new Date('2024-01-15T07:59:58'),
          level: 'info',
          message: '加载配置文件',
        },
        {
          id: '4-2',
          timestamp: new Date('2024-01-15T07:59:55'),
          level: 'info',
          message: '初始化数据库连接',
        },
      ],
    },
  ])

  return (
    <div className="mx-auto w-full max-w-4xl rounded-lg bg-white shadow-lg">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-800">站点日志</h2>
        <p className="mt-1 text-sm text-gray-600">按时间倒序排列 (最新 → 最旧)</p>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {logs.map(log => (
          <TreeNode key={log.id} log={log} />
        ))}
      </div>
    </div>
  )
}

export default SiteLogTree
