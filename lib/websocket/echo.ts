import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

// 让 Pusher 在全局可用，供 Laravel Echo 使用
declare global {
  interface Window {
    Pusher: typeof Pusher
    Echo: Echo<'reverb'>
  }
}

// 配置 Pusher（仅浏览器环境，避免 SSR 报错）
if (typeof window !== 'undefined') {
  window.Pusher = Pusher
}

// 创建 Echo 实例并追踪创建状态
let echoInstance: Echo<'reverb'> | null = null
let isCreating = false
let lastCreatedAt = 0
/** 创建当前实例时使用的 token，用于复用前校验是否已变化（如刷新/多标签页登录） */
let lastAuthToken: string | null = null

export function createEchoInstance(): Echo<'reverb'> | null {
  if (typeof window === 'undefined') {
    console.warn('Echo: Window 不可用，跳过 Echo 创建')
    return null
  }

  const now = Date.now()

  // 防止短时间内重复创建（React strict mode 保护）
  if (isCreating) {
    console.log('Echo: 跳过创建 - 正在创建中')
    return echoInstance!
  }

  // 复用前校验：localStorage 中的 token 若已变化（过期刷新、多标签页登录等），必须重建实例
  const currentToken = (() => {
    try {
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        const authData = JSON.parse(authStorage)
        return authData.state?.token ?? null
      }
    } catch {
      // ignore
    }
    return null
  })()

  const tokenChanged =
    echoInstance &&
    (currentToken !== lastAuthToken || (currentToken === '' && lastAuthToken !== null))

  if (tokenChanged) {
    console.log('Echo: token 已变化，销毁旧实例并重建')
    destroyEchoInstance()
    lastAuthToken = null
  }

  // 检查现有实例是否可用
  if (echoInstance && now - lastCreatedAt < 10000) {
    console.log('Echo: 跳过创建 - 已有可用实例', {
      hasExistingInstance: !!echoInstance,
      timeSinceLastCreation: now - lastCreatedAt,
      instanceType: typeof echoInstance,
    })

    // 检查连接状态
    try {
      if (echoInstance.connector && 'pusher' in echoInstance.connector) {
        const connector = echoInstance.connector as { pusher?: { connection?: { state?: string } } }
        const state = connector.pusher?.connection?.state
        console.log('Echo: 现有实例连接状态:', state)
        if (state === 'connected' || state === 'connecting') {
          console.log('Echo: 复用现有连接实例')
          return echoInstance
        }
      }
    } catch (error) {
      console.warn('Echo: 检查现有实例状态失败:', error)
    }

    return echoInstance
  }

  isCreating = true

  console.log('Echo: 正在创建新的 Echo 实例')

  // 刷新/新开页后清除 Pusher 的 transport 缓存，避免沿用上一会话的缓存导致连接失败
  try {
    localStorage.removeItem('pusherTransportTLS')
    localStorage.removeItem('pusherTransportNonTLS')
  } catch {
    // ignore
  }

  // 获取认证 token（始终从 localStorage 读取最新，与 auth-storage 一致）
  let authToken = ''
  try {
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      const authData = JSON.parse(authStorage)
      authToken = authData.state?.token ?? ''
    }
  } catch (error) {
    console.warn('Echo: 获取认证token失败:', error)
  }
  const previousToken = lastAuthToken
  lastAuthToken = authToken || null

  // 智能端口配置：当使用 HTTPS 且端口是标准端口时，不设置端口号
  const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME || 'https'
  const isHttps = scheme === 'https'
  const port = process.env.NEXT_PUBLIC_REVERB_PORT
    ? parseInt(process.env.NEXT_PUBLIC_REVERB_PORT)
    : isHttps
      ? 443
      : 8080

  // WebSocket 主机：优先使用环境变量配置的值
  const wsHost = (() => {
    if (process.env.NEXT_PUBLIC_REVERB_HOST) {
      return process.env.NEXT_PUBLIC_REVERB_HOST
    }
    if (typeof window !== 'undefined') {
      return window.location.host
    }
    // SSR 分支：从 API URL 解析 host 或使用默认
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    try {
      return new URL(apiUrl).host
    } catch {
      return 'localhost'
    }
  })()

  // 获取认证端点 URL：后端路由在 api.php 中，需走 /api/broadcasting/auth
  const toBroadcastAuthEndpoint = (baseUrl: string): string => {
    const normalizedBase = baseUrl.replace(/\/+$/, '')
    return normalizedBase.endsWith('/api')
      ? `${normalizedBase}/broadcasting/auth`
      : `${normalizedBase}/api/broadcasting/auth`
  }

  const authEndpoint = (() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL
    if (apiBase) {
      return toBroadcastAuthEndpoint(apiBase)
    }

    if (typeof window !== 'undefined') {
      const inferredApiBase = window.location.origin.replace(':3000', ':8000')
      return toBroadcastAuthEndpoint(inferredApiBase)
    }

    return toBroadcastAuthEndpoint(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  })()

  const config = {
    broadcaster: 'reverb',
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY || 'jnwliwk8ulk32jkwqcy7',
    wsHost,
    wsPort: isHttps ? (port === 443 ? undefined : port) : port,
    wssPort: isHttps ? (port === 443 ? undefined : port) : port,
    forceTLS: isHttps,
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
    authEndpoint,
    // 使用自定义 authorizer 处理 Sanctum Bearer token 认证
    authorizer: (channel: { name: string }) => ({
      authorize: (socketId: string, callback: (error: boolean | Error, data?: unknown) => void) => {
        // 如果没有 token，直接失败
        if (!authToken) {
          console.warn('Echo: 无认证token，跳过频道认证')
          callback(true, { message: 'No auth token' })
          return
        }

        fetch(authEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            socket_id: socketId,
            channel_name: channel.name,
          }),
        })
          .then(async response => {
            if (!response.ok) {
              const errorText = await response.text()
              console.error('Echo: 频道认证失败:', {
                status: response.status,
                channel: channel.name,
                error: errorText,
              })
              callback(true, new Error(`Auth failed: ${response.status}`))
              return
            }

            const data = await response.json()
            console.log('Echo: 频道认证成功:', {
              channel: channel.name,
              response: data,
            })
            callback(false, data)
          })
          .catch(error => {
            console.error('Echo: 频道认证请求异常:', {
              channel: channel.name,
              error,
            })
            callback(true, error)
          })
      },
    }),
  }

  console.log('Echo: 配置参数:', {
    broadcaster: config.broadcaster,
    key: config.key,
    wsHost: config.wsHost,
    wsPort: config.wsPort,
    authEndpoint: config.authEndpoint,
  })

  console.log('Echo: 认证token状态:', {
    hasToken: !!authToken,
    tokenLength: authToken.length,
    tokenPrefix: authToken.substring(0, 10) + '...',
  })

  // 认证端点诊断完成，无需继续测试

  // 添加环境变量调试信息
  console.log('Echo: 环境变量:', {
    NEXT_PUBLIC_REVERB_APP_KEY: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
    NEXT_PUBLIC_REVERB_HOST: process.env.NEXT_PUBLIC_REVERB_HOST,
    NEXT_PUBLIC_REVERB_PORT: process.env.NEXT_PUBLIC_REVERB_PORT,
    NEXT_PUBLIC_REVERB_SCHEME: process.env.NEXT_PUBLIC_REVERB_SCHEME,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  })

  // 检查是否需要销毁已有实例
  if (echoInstance) {
    console.log('Echo: 发现已有实例，检查是否需要重新创建')
    // 若当前 token 与已有实例创建时使用的 token 不同，必须重建
    if (authToken !== previousToken) {
      console.log('Echo: 认证已变化，销毁已有实例并重新创建')
      destroyEchoInstance()
    } else {
      try {
        if (echoInstance.connector && 'pusher' in echoInstance.connector) {
          const connector = echoInstance.connector as {
            pusher?: { connection?: { state?: string } }
          }
          if (connector.pusher?.connection?.state === 'connected') {
            console.log('Echo: 已有实例连接正常，复用现有实例')
            isCreating = false
            return echoInstance
          }
        }
      } catch (error) {
        console.warn('Echo: 检查现有连接状态失败:', error)
      }
      console.log('Echo: 销毁已有实例并重新创建')
      destroyEchoInstance()
    }
  }

  // 认证头部稍后设置（如有需要）

  try {
    // 创建新实例
    console.log('Echo: 最终配置:', config)
    const echo = new Echo(config as unknown as ConstructorParameters<typeof Echo>[0])
    console.log('Echo: 实例创建成功，类型:', typeof echo)

    // 校验实例有效性
    if (!echo || typeof echo.connect !== 'function') {
      throw new Error('创建的 Echo 实例无效')
    }

    // 让实例在全局可用
    echoInstance = echo as Echo<'reverb'>
    ;(window as { Echo?: unknown }).Echo = echo

    // 用新实例初始化连接监控（可选）
    try {
      import('./connection-monitor').then(({ getConnectionMonitor }) => {
        const monitor = getConnectionMonitor()
        if (monitor && typeof monitor.initializeWithEcho === 'function') {
          monitor.initializeWithEcho(echo as Echo<'reverb'>)
          console.log('Echo: 连接监控已初始化')
        } else {
          console.warn('Echo: 连接监控不可用，跳过')
        }
      })
    } catch (monitorError) {
      console.warn('Echo: 初始化连接监控失败:', monitorError)
      // 监控初始化失败不影响主流程
    }

    // 尝试连接 Echo 实例
    try {
      if (echo && typeof echo.connect === 'function') {
        echo.connect()
        console.log('Echo: 已发起连接')

        // 添加连接状态监听
        if (echo.connector && 'pusher' in echo.connector && echo.connector.pusher) {
          const pusherConnector = echo.connector as {
            pusher: {
              connection: { bind: (event: string, callback: (error?: unknown) => void) => void }
            }
          }
          pusherConnector.pusher.connection.bind('connected', () => {
            console.log('🔥 Echo: 连接成功！')
          })

          pusherConnector.pusher.connection.bind('connecting', () => {
            console.log('🔥 Echo: 正在连接...')
          })

          pusherConnector.pusher.connection.bind('disconnected', () => {
            console.log('🔥 Echo: 连接断开')
          })

          pusherConnector.pusher.connection.bind('error', (error: unknown) => {
            console.error('🔥 Echo: 连接错误:', error)
          })

          pusherConnector.pusher.connection.bind('unavailable', (error: unknown) => {
            // WebSocket 连接不可用，但不影响非实时功能（如 Wiki、笔记等）
            // 只在开发环境显示详细错误
            if (process.env.NODE_ENV === 'development') {
              console.warn('🔥 Echo: 连接不可用（不影响 Wiki 等 REST API 功能）:', error)
            }
          })
        }
      }
    } catch (connectError) {
      console.warn('Echo: 发起连接失败:', connectError)
    }

    console.log('Echo: 实例初始化完成，已就绪')
    lastCreatedAt = now
    isCreating = false
    return echo as Echo<'reverb'>
  } catch (error) {
    console.error('Echo: 创建实例失败:', error)
    echoInstance = null
    isCreating = false
    throw error
  }
}

// 延迟销毁计时器
let destroyTimer: NodeJS.Timeout | null = null

export function destroyEchoInstance(immediate = false): void {
  if (!echoInstance) {
    console.log('Echo: 无实例需要销毁')
    return
  }

  // 如果不是立即销毁，使用延迟机制
  if (!immediate) {
    console.log('Echo: 延迟销毁 Echo 实例 (500ms)')

    // 清除之前的定时器
    if (destroyTimer) {
      clearTimeout(destroyTimer)
    }

    destroyTimer = setTimeout(() => {
      if (echoInstance) {
        console.log('Echo: 执行延迟销毁')
        performDestroy()
      } else {
        console.log('Echo: 实例已被清理，跳过销毁')
      }
      destroyTimer = null
    }, 500)
    return
  }

  // 立即销毁
  performDestroy()
}

function performDestroy(): void {
  if (!echoInstance) return

  console.log('Echo: 正在销毁 Echo 实例')
  try {
    echoInstance.disconnect()
  } catch (error) {
    console.warn('Echo: 断开连接时出错:', error)
  }
  echoInstance = null
  lastAuthToken = null
  ;(window as { Echo?: unknown }).Echo = undefined
}

// 取消延迟销毁
export function cancelDestroyEchoInstance(): void {
  if (destroyTimer) {
    console.log('Echo: 取消延迟销毁')
    clearTimeout(destroyTimer)
    destroyTimer = null
  }
}

export function getEchoInstance(): Echo<'reverb'> | null {
  return echoInstance
}

export default echoInstance
