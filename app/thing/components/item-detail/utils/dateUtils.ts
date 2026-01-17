import { format } from 'date-fns'

// 日期格式化工具函数
export const formatDate = (date: string | null) => {
  if (!date) return '-'
  try {
    return format(new Date(date), 'yyyy-MM-dd')
  } catch {
    return '无效日期'
  }
}

export const formatDateTime = (date: string | null) => {
  if (!date) return '-'
  try {
    return format(new Date(date), 'yyyy-MM-dd HH:mm:ss')
  } catch {
    return '无效日期'
  }
}

export const calculateDaysDifference = (startDate: string | null, endDate: string | null) => {
  if (!startDate || !endDate) return null
  try {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  } catch {
    return null
  }
}
