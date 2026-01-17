/**
 * 预览类型常量
 */
export const PREVIEW_TYPES = {
  LOADING: 'loading',
  IMAGE: 'image',
  PDF: 'pdf',
  TEXT: 'text',
  DOCUMENT: 'document',
  UNKNOWN: 'unknown',
} as const

export type PreviewType = (typeof PREVIEW_TYPES)[keyof typeof PREVIEW_TYPES]
