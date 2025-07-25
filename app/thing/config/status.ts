export const statusMap = {
  active: { label: '使用中', variant: 'bg-green-500' },
  inactive: { label: '闲置', variant: 'outline' },
  expired: { label: '已过期', variant: 'destructive' },
} as const

export type ThingStatus = keyof typeof statusMap
