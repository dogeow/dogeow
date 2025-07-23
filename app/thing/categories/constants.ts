// API 端点
export const API_ENDPOINTS = {
  CATEGORIES: '/things/categories',
  UNCATEGORIZED_ITEMS: '/things/items?uncategorized=true&own=true',
} as const

// 表单验证
export const VALIDATION = {
  CATEGORY_NAME_MAX_LENGTH: 50,
  CATEGORY_NAME_MIN_LENGTH: 1,
} as const

// 错误消息
export const ERROR_MESSAGES = {
  CATEGORY_NAME_EMPTY: '分类名称不能为空',
  CATEGORY_NAME_TOO_LONG: `分类名称不能超过 ${VALIDATION.CATEGORY_NAME_MAX_LENGTH} 个字符`,
  UPDATE_FAILED: '更新失败，请重试',
  DELETE_FAILED: '删除失败，请重试',
  CREATE_FAILED: '创建失败，请重试',
} as const

// 成功消息
export const SUCCESS_MESSAGES = {
  CATEGORY_CREATED: '分类创建成功',
  CATEGORY_UPDATED: '分类更新成功',
  CATEGORY_DELETED: '分类删除成功',
} as const
