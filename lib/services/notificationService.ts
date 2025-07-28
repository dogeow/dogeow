/**
 * Notification Service
 * Handles browser notifications, sound effects, and notification permissions
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

    // Initialize audio context for sound effects
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
   * Request browser notification permission
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
   * Check if browser notifications are supported and permitted
   */
  public isNotificationSupported(): boolean {
    return 'Notification' in window && Notification.permission === 'granted'
  }

  /**
   * Show browser notification
   */
  public showNotification(options: NotificationOptions): Notification | null {
    if (!this.isNotificationSupported()) {
      return null
    }

    // Don't show notification if tab is active (unless explicitly required)
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

      // Auto-close notification after 5 seconds unless it requires interaction
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close()
        }, 5000)
      }

      // Handle notification click
      notification.onclick = () => {
        window.focus()
        notification.close()

        // If there's custom data, handle it
        if (options.data && typeof options.data === 'object' && 'roomId' in options.data) {
          // This could trigger navigation to the specific room
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
   * Preload sound effects
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
   * Play sound effect
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
   * Create notification for new message
   */
  public notifyNewMessage(
    roomName: string,
    senderName: string,
    message: string,
    roomId: number,
    playSound = true
  ): void {
    // Show browser notification
    this.showNotification({
      title: `New message in ${roomName}`,
      body: `${senderName}: ${message}`,
      tag: `room-${roomId}`,
      data: { roomId, type: 'message' },
    })

    // Play sound effect
    if (playSound) {
      this.playSound('message')
    }
  }

  /**
   * Create notification for mention
   */
  public notifyMention(
    roomName: string,
    senderName: string,
    message: string,
    roomId: number,
    messageId: number,
    playSound = true
  ): void {
    // Show browser notification with higher priority
    this.showNotification({
      title: `${senderName} mentioned you in ${roomName}`,
      body: message,
      tag: `mention-${messageId}`,
      requireInteraction: true,
      data: { roomId, messageId, type: 'mention' },
    })

    // Play mention sound effect
    if (playSound) {
      this.playSound('mention')
    }
  }

  /**
   * Create notification for user joining
   */
  public notifyUserJoined(
    roomName: string,
    userName: string,
    roomId: number,
    playSound = true
  ): void {
    // Show browser notification
    this.showNotification({
      title: `${userName} joined ${roomName}`,
      tag: `join-${roomId}-${Date.now()}`,
      silent: true, // Less intrusive for join notifications
      data: { roomId, type: 'user-joined' },
    })

    // Play join sound effect
    if (playSound) {
      this.playSound('join', { volume: 0.3 })
    }
  }

  /**
   * Create notification for user leaving
   */
  public notifyUserLeft(
    roomName: string,
    userName: string,
    roomId: number,
    playSound = true
  ): void {
    // Show browser notification
    this.showNotification({
      title: `${userName} left ${roomName}`,
      tag: `leave-${roomId}-${Date.now()}`,
      silent: true, // Less intrusive for leave notifications
      data: { roomId, type: 'user-left' },
    })

    // Play leave sound effect
    if (playSound) {
      this.playSound('leave', { volume: 0.3 })
    }
  }

  /**
   * Clear all notifications with a specific tag pattern
   */
  public clearNotifications(tagPattern?: string): void {
    // Unfortunately, there's no direct way to clear notifications by tag
    // This is a limitation of the Notifications API
    // We can only close notifications we have references to
    console.log(`Clearing notifications with pattern: ${tagPattern}`)
  }

  /**
   * Check if document is hidden (tab is inactive)
   */
  public isTabInactive(): boolean {
    return typeof document !== 'undefined' && document.hidden
  }

  /**
   * Add visibility change listener
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
