import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

/**
 * 格式化时间
 */
export function formatNoteDate(dateString: string): string {
  try {
    return format(new Date(dateString), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })
  } catch {
    return dateString
  }
}
