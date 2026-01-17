import { CheckCircle, AlertCircle, XCircle } from 'lucide-react'

export interface StatusConfig {
  color: string
  bgColor: string
  borderColor: string
  badgeColor: string
  icon: React.ReactNode
  label: string
}

const neutralStatusConfig = {
  color: 'text-gray-600 dark:text-gray-400',
  bgColor: 'bg-gray-50 dark:bg-gray-900/40',
  borderColor: 'border-gray-200 dark:border-gray-800',
  badgeColor:
    'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
}

export const getStatusConfig = (status: string): StatusConfig => {
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
