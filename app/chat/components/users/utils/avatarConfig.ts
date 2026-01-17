/**
 * Avatar 尺寸配置
 */
export const AVATAR_CONFIGS = {
  sm: {
    className: 'h-8 w-8',
    size: { width: 32, height: 32 },
    textSize: 'text-xs',
  },
  md: {
    className: 'h-10 w-10',
    size: { width: 40, height: 40 },
    textSize: '',
  },
  lg: {
    className: 'h-12 w-12',
    size: { width: 48, height: 48 },
    textSize: '',
  },
} as const
