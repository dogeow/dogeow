import { Zap, Bug, BookOpen, GitBranch, Star } from 'lucide-react'

export interface TypeConfig {
  color: string
  bgColor: string
  borderColor: string
  badgeColor: string
  icon: React.ReactNode
  label: string
}

const neutralTypeConfig = {
  color: 'text-gray-600 dark:text-gray-400',
  bgColor: 'bg-gray-50 dark:bg-gray-900/40',
  borderColor: 'border-gray-200 dark:border-gray-800',
  badgeColor:
    'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
}

export const getTypeConfig = (
  type: string,
  t: (key: string, fallback?: string) => string
): TypeConfig => {
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
