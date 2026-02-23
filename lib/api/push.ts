/**
 * Web Push 相关 API：获取 VAPID 公钥、保存/删除推送订阅
 */

import { get, post, delWithBody } from './index'

const VAPID_ENDPOINT = 'webpush/vapid'
const SUBSCRIPTION_ENDPOINT = 'user/push-subscription'

export interface VapidResponse {
  public_key: string
}

/**
 * 获取服务端 VAPID 公钥（公开接口，无需登录）
 */
export function getVapidPublicKey(): Promise<VapidResponse> {
  return get<VapidResponse>(VAPID_ENDPOINT)
}

/**
 * 推送订阅 payload，与后端 PushSubscriptionRequest 一致
 */
export interface PushSubscriptionPayload {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

/**
 * 将 PushSubscription 转为后端需要的 payload
 */
export function subscriptionToPayload(subscription: PushSubscription): PushSubscriptionPayload {
  const keyP256 = subscription.getKey('p256dh')
  const keyAuth = subscription.getKey('auth')
  if (!keyP256 || !keyAuth) {
    throw new Error('PushSubscription keys missing')
  }
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: base64UrlFromBuffer(keyP256),
      auth: base64UrlFromBuffer(keyAuth),
    },
  }
}

function base64UrlFromBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * 将 base64url 字符串解码为 Uint8Array（用于 VAPID 公钥）
 */
export function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * 保存当前用户的推送订阅（需登录）
 */
export function savePushSubscription(
  payload: PushSubscriptionPayload
): Promise<{ message: string }> {
  return post<{ message: string }>(SUBSCRIPTION_ENDPOINT, payload)
}

/**
 * 删除当前用户的指定推送订阅（需登录）
 */
export function deletePushSubscription(endpoint: string): Promise<{ message: string }> {
  return delWithBody<{ message: string }>(SUBSCRIPTION_ENDPOINT, { endpoint })
}
