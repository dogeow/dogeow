import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合并 Tailwind CSS 类名
 * 使用 clsx 和 tailwind-merge 组合类名并解决冲突
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 导出颜色工具函数
export { isLightColor, generateRandomColor, hexToHSL } from './colorUtils'
