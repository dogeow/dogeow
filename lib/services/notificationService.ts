/**
 * 通知服务
 * 处理浏览器通知、音效和通知权限
 */

export interface NotificationOptions {
  title: string
  body?: string
  icon?: string
  tag?: string
  silent?: boolean
  requireInteraction?: boolean
  data?: unknown
}

export interface SoundOptions {
  volume?: number
  loop?: boolean
}

class NotificationService {
  private static instance: NotificationService
  private audioContext: AudioContext | null = null
  private soundCache: Map<string, AudioBuffer> = new Map()
  private isInitialized = false

  private constructor() {
    this.initialize()
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  private async initialize() {
    if (this.isInitialized) return

    // 初始化音频上下文用于音效
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      try {
        this.audioContext = new AudioContext()
        await this.preloadSounds()
      } catch (error) {
        console.warn('Failed to initialize audio context:', error)
      }
    }

    this.isInitialized = true
  }

  /**
   * 请求浏览器通知权限
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Browser notifications are not supported')
      return 'denied'
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission === 'denied') {
      return 'denied'
    }

    try {
      const permission = await Notification.requestPermission()
      return permission
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return 'denied'
    }
  }

  /**
   * 检查浏览器是否支持并允许通知
   */
  public isNotificationSupported(): boolean {
    return 'Notification' in window && Notification.permission === 'granted'
  }

  /**
   * 显示浏览器通知
   */
  public showNotification(options: NotificationOptions): Notification | null {
    if (!this.isNotificationSupported()) {
      return null
    }

    // 如果标签页处于激活状态则不显示通知（除非明确要求）
    if (!document.hidden && !options.requireInteraction) {
      return null
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: options.tag,
        silent: options.silent || false,
        requireInteraction: options.requireInteraction || false,
        data: options.data,
      })

      // 如果不需要交互，5秒后自动关闭通知
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close()
        }, 5000)
      }

      // 处理通知点击事件
      notification.onclick = () => {
        window.focus()
        notification.close()

        // 如果有自定义数据，进行处理
        if (options.data && typeof options.data === 'object' && 'roomId' in options.data) {
          // 这里可以触发跳转到指定房间
          window.dispatchEvent(
            new CustomEvent('notification-click', {
              detail: options.data,
            })
          )
        }
      }

      return notification
    } catch (error) {
      console.error('Failed to show notification:', error)
      return null
    }
  }

  /**
   * 预加载音效
   */
  private async preloadSounds() {
    if (!this.audioContext) return

    const sounds = [
      { name: 'message', url: '/sounds/message.mp3' },
      { name: 'mention', url: '/sounds/mention.mp3' },
      { name: 'join', url: '/sounds/join.mp3' },
      { name: 'leave', url: '/sounds/leave.mp3' },
    ]

    for (const sound of sounds) {
      try {
        const response = await fetch(sound.url)
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer()
          const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
          this.soundCache.set(sound.name, audioBuffer)
        }
      } catch (error) {
        console.warn(`Failed to preload sound ${sound.name}:`, error)
      }
    }
  }

  /**
   * 播放音效
   */
  public playSound(soundName: string, options: SoundOptions = {}): void {
    if (!this.audioContext || !this.soundCache.has(soundName)) {
      return
    }

    try {
      const audioBuffer = this.soundCache.get(soundName)!
      const source = this.audioContext.createBufferSource()
      const gainNode = this.audioContext.createGain()

      source.buffer = audioBuffer
      source.loop = options.loop || false
      gainNode.gain.value = options.volume || 0.5

      source.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      source.start()
    } catch (error) {
      console.error(`Failed to play sound ${soundName}:`, error)
    }
  }

  /**
   * 创建新消息通知
   */
  public notifyNewMessage(
    roomName: string,
    senderName: string,
    message: string,
    roomId: number,
    playSound = true
  ): void {
    // 显示浏览器通知
    this.showNotification({
      title: `New message in ${roomName}`,
      body: `${senderName}: ${message}`,
      tag: `room-${roomId}`,
      data: { roomId, type: 'message' },
    })

    // 播放音效
    if (playSound) {
      this.playSound('message')
    }
  }

  /**
   * 创建@提及通知
   */
  public notifyMention(
    roomName: string,
    senderName: string,
    message: string,
    roomId: number,
    messageId: number,
    playSound = true
  ): void {
    // 显示高优先级浏览器通知
    this.showNotification({
      title: `${senderName} mentioned you in ${roomName}`,
      body: message,
      tag: `mention-${messageId}`,
      requireInteraction: true,
      data: { roomId, messageId, type: 'mention' },
    })

    // 播放@提及音效
    if (playSound) {
      this.playSound('mention')
    }
  }

  /**
   * 创建用户加入通知
   */
  public notifyUserJoined(
    roomName: string,
    userName: string,
    roomId: number,
    playSound = true
  ): void {
    // 显示浏览器通知
    this.showNotification({
      title: `${userName} joined ${roomName}`,
      tag: `join-${roomId}-${Date.now()}`,
      silent: true, // 加入通知较为安静
      data: { roomId, type: 'user-joined' },
    })

    // 播放加入音效
    if (playSound) {
      this.playSound('join', { volume: 0.3 })
    }
  }

  /**
   * 创建用户离开通知
   */
  public notifyUserLeft(
    roomName: string,
    userName: string,
    roomId: number,
    playSound = true
  ): void {
    // 显示浏览器通知
    this.showNotification({
      title: `${userName} left ${roomName}`,
      tag: `leave-${roomId}-${Date.now()}`,
      silent: true, // 离开通知较为安静
      data: { roomId, type: 'user-left' },
    })

    // 播放离开音效
    if (playSound) {
      this.playSound('leave', { volume: 0.3 })
    }
  }

  /**
   * 清除所有指定标签模式的通知
   */
  public clearNotifications(tagPattern?: string): void {
    // 很遗憾，无法通过标签直接清除通知
    // 这是 Notifications API 的限制
    // 只能关闭我们有引用的通知
    console.log(`Clearing notifications with pattern: ${tagPattern}`)
  }

  /**
   * 检查文档是否隐藏（标签页是否处于非激活状态）
   */
  public isTabInactive(): boolean {
    return typeof document !== 'undefined' && document.hidden
  }

  /**
   * 添加可见性变化监听器
   */
  public onVisibilityChange(callback: (isHidden: boolean) => void): () => void {
    if (typeof document === 'undefined') {
      return () => {}
    }

    const handleVisibilityChange = () => {
      callback(document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }
}

export default NotificationService
