import type { FilterState } from '../types'
import { initialFilters } from '../types'

// 应用筛选逻辑
export function applyFilters(currentFilters: FilterState, onApply: (filters: FilterState) => void) {
  // 创建一个新的对象，只保留非空、非"all"的值
  const appliedFilters = Object.entries(currentFilters).reduce((acc, [key, value]) => {
    const fieldKey = key as keyof FilterState
    // 保留包含空日期的控制参数和公开状态参数，但过滤不在后端允许的过滤参数
    if (
      fieldKey === 'include_null_purchase_date' ||
      fieldKey === 'include_null_expiry_date' ||
      fieldKey === 'is_public' ||
      (fieldKey !== 'exclude_null_purchase_date' &&
        fieldKey !== 'exclude_null_expiry_date' &&
        value !== null &&
        value !== '' &&
        value !== 'all')
    ) {
      // 特殊处理标签字段，将逗号分隔的字符串转换为数组
      if (fieldKey === 'tags' && typeof value === 'string' && value.trim() !== '') {
        // 分割字符串并转换为数字数组
        const tagArray = value
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag !== '')
          .map(Number)
        // 使用 Object.assign 避免类型错误
        Object.assign(acc, { [fieldKey]: tagArray })
      } else {
        acc[fieldKey] = value
      }
    }
    return acc
  }, {} as Partial<FilterState>)

  onApply(appliedFilters as FilterState)
}

// 检查是否有活跃的筛选条件
export function hasActiveFilters(filters: FilterState): boolean {
  return Object.keys(filters).some(key => {
    const fieldKey = key as keyof FilterState
    const currentValue = filters[fieldKey]
    const initialValue = initialFilters[fieldKey]

    // 特殊处理日期字段
    if (
      typeof fieldKey === 'string' &&
      (fieldKey.includes('date_from') || fieldKey.includes('date_to'))
    ) {
      return currentValue !== null && initialValue === null
    }

    return currentValue !== initialValue
  })
}

// 从保存的筛选条件初始化
export function getInitialFilterState(savedFilters: Record<string, unknown>): FilterState {
  if (Object.keys(savedFilters).length === 0) {
    return initialFilters
  }

  // 合并保存的筛选条件和初始条件
  const mergedFilters = { ...initialFilters }

  // 处理普通字段
  Object.entries(savedFilters).forEach(([key, value]) => {
    if (key in mergedFilters) {
      // 特殊处理日期字段
      if (key.includes('date_from') || key.includes('date_to')) {
        if (value) {
          if (
            key === 'purchase_date_from' ||
            key === 'purchase_date_to' ||
            key === 'expiry_date_from' ||
            key === 'expiry_date_to'
          ) {
            // 使用 Object.assign 避免类型错误
            Object.assign(mergedFilters, { [key]: new Date(value as string) })
          }
        }
      } else {
        // 使用 Object.assign 避免类型错误
        Object.assign(mergedFilters, { [key]: value })
      }
    }
  })

  return mergedFilters
}
