import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

// 让 Pusher 在全局可用，供 Laravel Echo 使用
declare global {
  interface Window {
    Pusher: typeof Pusher
    Echo: Echo<'reverb'>
  }
}

// 配置 Pusher
window.Pusher = Pusher

// 创建 Echo 实例并追踪创建状态
let echoInstance: Echo<'reverb'> | null = null
let isCreating = false
let lastCreatedAt = 0

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

  // 获取认证token
  let authToken = ''
  try {
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      const authData = JSON.parse(authStorage)
      authToken = authData.state?.token || ''
    }
  } catch (error) {
    console.warn('Echo: 获取认证token失败:', error)
  }

  // 智能端口配置：当使用 HTTPS 且端口是标准端口时，不设置端口号
  const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME || 'https'
  const isHttps = scheme === 'https'
  const port = process.env.NEXT_PUBLIC_REVERB_PORT
    ? parseInt(process.env.NEXT_PUBLIC_REVERB_PORT)
    : isHttps
      ? 443
      : 8080

  const config = {
    broadcaster: 'reverb',
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY || 'jnwliwk8ulk32jkwqcy7',
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST || 'ws.game.dogeow.com',
    wsPort: isHttps ? (port === 443 ? undefined : port) : port,
    wssPort: isHttps ? (port === 443 ? undefined : port) : port,
    forceTLS: isHttps,
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
    authEndpoint: `${process.env.NEXT_PUBLIC_API_URL}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: authToken ? `Bearer ${authToken}` : '',
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    },
  }

  console.log('Echo: 配置参数:', {
    ...config,
    auth: { headers: '[HIDDEN]' },
  })

  console.log('Echo: 认证token状态:', {
    hasToken: !!authToken,
    tokenLength: authToken.length,
    tokenPrefix: authToken.substring(0, 10) + '...',
    authHeader: config.auth?.headers?.Authorization ? 'Present' : 'Missing',
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
    // 如果已有实例且连接正常，直接返回
    try {
      if (echoInstance.connector && 'pusher' in echoInstance.connector) {
        const connector = echoInstance.connector as { pusher?: { connection?: { state?: string } } }
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
            console.error('🔥 Echo: 连接不可用:', error)
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
