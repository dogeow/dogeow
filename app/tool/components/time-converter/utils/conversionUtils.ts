import { ERROR_MESSAGES, MIN_YEAR, MAX_YEAR, MILLISECOND_THRESHOLD } from '../constants'

/**
 * 验证年份是否在有效范围内
 */
export const validateYear = (year: number): boolean => year >= MIN_YEAR && year <= MAX_YEAR

/**
 * 清理时间戳输入（只保留数字）
 */
export const cleanTimestamp = (input: string): string => input.replace(/\D/g, '')

/**
 * 标准化日期时间格式
 */
export const standardizeDateTime = (input: string): string => {
  const [date, time] = input.split(' ')
  const dateParts = date?.split('-') ?? []
  if (dateParts.length !== 3) return input
  const [year, month, day] = dateParts
  const standardDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  return time ? `${standardDate} ${time}` : standardDate
}

/**
 * 验证输出是否有效（不是错误消息）
 */
export const isValidOutput = (output: string, errorMessageList: readonly string[]): boolean =>
  Boolean(output && !errorMessageList.includes(output as (typeof errorMessageList)[number]))
