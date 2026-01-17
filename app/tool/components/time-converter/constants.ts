/**
 * 时间转换器常量配置
 */
export const DEFAULT_FORMAT = 'yyyy-MM-dd HH:mm:ss'
export const MIN_YEAR = 1970
export const MAX_YEAR = 2100
export const MILLISECOND_THRESHOLD = 13
export const COPY_FEEDBACK_DURATION = 2000
export const CURRENT_TIME_UPDATE_INTERVAL = 1000

export const FLEXIBLE_DATE_REGEX = /^\d{4}-\d{1,2}-\d{1,2}( \d{1,2}:\d{1,2}:\d{1,2})?$/
export const STANDARD_DATE_FORMAT = 'yyyy-MM-dd HH:mm:ss'

export const ERROR_MESSAGES = {
  EMPTY_TIMESTAMP: '请输入时间戳',
  INVALID_TIMESTAMP: '无效的时间戳',
  CONVERSION_ERROR: '转换出错',
  EMPTY_DATETIME: '请输入日期时间',
  INVALID_DATE_FORMAT: '日期格式应为 yyyy-M-d 或 yyyy-MM-dd HH:mm:ss',
  INVALID_DATE: '无效的日期格式',
  OUT_OF_RANGE: (year: number) => `可能不正确的时间 (${year}年)，请检查`,
} as const

export const ERROR_MESSAGE_LIST = [
  ERROR_MESSAGES.EMPTY_TIMESTAMP,
  ERROR_MESSAGES.INVALID_TIMESTAMP,
  ERROR_MESSAGES.CONVERSION_ERROR,
  ERROR_MESSAGES.EMPTY_DATETIME,
  ERROR_MESSAGES.INVALID_DATE_FORMAT,
  ERROR_MESSAGES.INVALID_DATE,
] as const

export type CopyType = 'timestamp' | 'dateTime'
