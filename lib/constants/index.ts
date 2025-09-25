// 应用常量
export const APP_NAME = 'DogeOW' as const
export const APP_DESCRIPTION = 'DogeOW是一个集学习、生活、工作于一体的综合性平台' as const

// 性能相关常量
export const PERFORMANCE = {
  IMAGE_QUALITY: 85,
  LOADING_DEBOUNCE: 300,
  SCROLL_THROTTLE: 100,
  SEARCH_DEBOUNCE: 500,
} as const

// 尺寸常量
export const SIZES = {
  TILE_MIN_HEIGHT: '8rem',
  CONTENT_MAX_WIDTH: '7xl',
  PREVIEW_MAX_LENGTH: 150,
} as const

// 动画常量
export const ANIMATIONS = {
  TRANSITION_DURATION: 200,
  HOVER_SCALE: 0.95,
  ACTIVE_SCALE: 0.9,
} as const

// 存储键名
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth-token',
  AUTH_STORAGE: 'auth-storage',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const

// API 相关常量
export const API = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
} as const

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  AUTH_REQUIRED: '请先登录后再进行此操作',
  PERMISSION_DENIED: '您没有权限执行此操作',
  UNKNOWN_ERROR: '发生未知错误，请稍后重试',
} as const

// 成功消息
export const SUCCESS_MESSAGES = {
  SAVE_SUCCESS: '保存成功',
  DELETE_SUCCESS: '删除成功',
  UPDATE_SUCCESS: '更新成功',
  LOGIN_SUCCESS: '登录成功',
  LOGOUT_SUCCESS: '退出成功',
} as const
