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
  if (isCreating || (echoInstance && now - lastCreatedAt < 1000)) {
    console.log('Echo: 跳过创建 - 正在创建或刚刚创建过')
    return echoInstance!
  }

  isCreating = true

  console.log('Echo: 正在创建新的 Echo 实例')

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
        Authorization: '',
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    },
  }

  console.log('Echo: 配置参数:', {
    ...config,
    auth: { headers: '[HIDDEN]' },
  })

  // 添加环境变量调试信息
  console.log('Echo: 环境变量:', {
    NEXT_PUBLIC_REVERB_APP_KEY: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
    NEXT_PUBLIC_REVERB_HOST: process.env.NEXT_PUBLIC_REVERB_HOST,
    NEXT_PUBLIC_REVERB_PORT: process.env.NEXT_PUBLIC_REVERB_PORT,
    NEXT_PUBLIC_REVERB_SCHEME: process.env.NEXT_PUBLIC_REVERB_SCHEME,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  })

  // 先销毁已有实例
  if (echoInstance) {
    console.log('Echo: 销毁已有实例')
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

export function destroyEchoInstance(): void {
  if (echoInstance) {
    console.log('Echo: 正在销毁 Echo 实例')
    try {
      echoInstance.disconnect()
    } catch (error) {
      console.warn('Echo: 断开连接时出错:', error)
    }
    echoInstance = null
    ;(window as { Echo?: unknown }).Echo = undefined
  }
}

export function getEchoInstance(): Echo<'reverb'> | null {
  return echoInstance
}

export default echoInstance
