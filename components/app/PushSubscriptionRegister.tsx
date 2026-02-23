'use client'

import { usePushSubscription } from '@/hooks/usePushSubscription'

/**
 * 挂载后：在用户已登录且已授权通知时，自动向服务端注册 Web Push 订阅。
 * 不渲染任何 UI，仅执行订阅逻辑。
 */
export function PushSubscriptionRegister() {
  usePushSubscription()
  return null
}
