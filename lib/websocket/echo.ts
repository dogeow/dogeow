import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

// Make Pusher available globally for Laravel Echo
declare global {
  interface Window {
    Pusher: typeof Pusher
    Echo: Echo<'reverb'>
  }
}

// Configure Pusher
window.Pusher = Pusher

// Echo configuration for Laravel Reverb
const echoConfig = {
  broadcaster: 'reverb' as const,
  key: process.env.NEXT_PUBLIC_REVERB_APP_KEY || 'jnwliwk8ulk32jkwqcy7',
  wsHost: process.env.NEXT_PUBLIC_REVERB_HOST || '127.0.0.1',
  wsPort: parseInt(process.env.NEXT_PUBLIC_REVERB_PORT || '8080'),
  wssPort: parseInt(process.env.NEXT_PUBLIC_REVERB_PORT || '443'),
  forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME || 'https') === 'https',
  enabledTransports: ['ws', 'wss'],
  disableStats: true,
  authEndpoint: `${process.env.NEXT_PUBLIC_API_BASE_URL}/broadcasting/auth`,
  auth: {
    headers: {
      Authorization: '',
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  },
}

// Create Echo instance and track creation state
let echoInstance: Echo<'reverb'> | null = null
let isCreating = false
let lastCreatedAt = 0

export function createEchoInstance(): Echo<'reverb'> | null {
  if (typeof window === 'undefined') {
    console.warn('Echo: Window not available, skipping Echo creation')
    return null
  }

  const now = Date.now()

  // Prevent rapid successive creations (React strict mode protection)
  if (isCreating || (echoInstance && now - lastCreatedAt < 1000)) {
    console.log('Echo: Skipping creation - already creating or recently created')
    return echoInstance!
  }

  isCreating = true

  console.log('Echo: Creating new Echo instance')

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
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
    wsPort: isHttps ? (port === 443 ? undefined : port) : port,
    wssPort: isHttps ? (port === 443 ? undefined : port) : port,
    forceTLS: isHttps,
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${process.env.NEXT_PUBLIC_API_BASE_URL}/broadcasting/auth`,
    auth: {
      headers: {},
    },
  }

  console.log('Echo: Configuration:', {
    ...config,
    auth: { headers: '[HIDDEN]' },
  })

  // Destroy existing instance first
  if (echoInstance) {
    console.log('Echo: Destroying existing instance')
    destroyEchoInstance()
  }

  // Auth headers will be set up later if needed

  try {
    // Create new instance
    console.log('Echo: Final config:', echoConfig)
    const echo = new Echo(echoConfig as unknown as ConstructorParameters<typeof Echo>[0])
    console.log('Echo: Instance created successfully, type:', typeof echo)

    // Verify the instance is valid
    if (!echo || typeof echo.connect !== 'function') {
      throw new Error('Invalid Echo instance created')
    }

    // Make it available globally
    echoInstance = echo as Echo<'reverb'>
    ;(window as { Echo?: unknown }).Echo = echo

    // Initialize connection monitor with the new instance (optional)
    try {
      import('./connection-monitor').then(({ getConnectionMonitor }) => {
        const monitor = getConnectionMonitor()
        if (monitor && typeof monitor.initializeWithEcho === 'function') {
          monitor.initializeWithEcho(echo as Echo<'reverb'>)
          console.log('Echo: Connection monitor initialized')
        } else {
          console.warn('Echo: Connection monitor not available, skipping')
        }
      })
    } catch (monitorError) {
      console.warn('Echo: Failed to initialize connection monitor:', monitorError)
      // Don't fail the entire creation for monitor issues
    }

    console.log('Echo: Instance initialized and ready')
    lastCreatedAt = now
    isCreating = false
    return echo as Echo<'reverb'>
  } catch (error) {
    console.error('Echo: Failed to create instance:', error)
    echoInstance = null
    isCreating = false
    throw error
  }
}

export function destroyEchoInstance(): void {
  if (echoInstance) {
    console.log('Echo: Destroying Echo instance')
    try {
      echoInstance.disconnect()
    } catch (error) {
      console.warn('Echo: Error during disconnect:', error)
    }
    echoInstance = null
    ;(window as { Echo?: unknown }).Echo = undefined
  }
}

export function getEchoInstance(): Echo<'reverb'> | null {
  return echoInstance
}

export default echoInstance
