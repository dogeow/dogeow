import type Echo from 'laravel-echo'

/**
 * 创建频道包装器，合并消息频道和用户状态频道
 */
export const createChannelWrapper = (
  echoInstance: Echo<'reverb'>,
  roomId: string
): {
  listen: (event: string, callback: (data: unknown) => void) => void
  bind: (event: string, callback: (data?: unknown) => void) => void
  stopListening: (event?: string, callback?: () => void) => void
  channel: ReturnType<Echo<'reverb'>['channel']>
  presenceChannel: ReturnType<Echo<'reverb'>['channel']>
} => {
  // 创建普通频道用于消息
  const channel = echoInstance.channel(`chat.room.${roomId}`)
  console.log('WebSocket: Created channel for room', roomId, 'channel:', channel)

  if (!channel) {
    throw new Error(`Failed to create channel for room ${roomId}`)
  }

  // 使用普通频道代替presence频道
  const presenceChannel = echoInstance.channel(`chat.room.${roomId}.users`)
  console.log('WebSocket: ✅ 用户状态频道创建成功（使用普通频道）')

  return {
    listen: (event: string, callback: (data: unknown) => void) => {
      try {
        // 消息事件通过普通频道监听
        if (event.includes('message') || event.includes('MessageSent') || event === '.') {
          channel.listen(event, callback)
        } else {
          // 用户事件通过presence频道监听
          presenceChannel.listen(event, callback)
        }
      } catch (error) {
        console.error('WebSocket: Error listening to event', event, ':', error)
      }
    },
    bind: (event: string, callback: (data?: unknown) => void) => {
      try {
        // Laravel Echo没有bind方法，使用listen代替
        channel.listen(event, callback)
        presenceChannel.listen(event, callback)
      } catch (error) {
        console.error('WebSocket: Error binding to event', event, ':', error)
      }
    },
    stopListening: (event?: string, callback?: () => void) => {
      try {
        if (event && callback) {
          channel.stopListening(event, callback)
          presenceChannel.stopListening(event, callback)
        } else if (event) {
          console.log('WebSocket: Cannot stop listening without callback, event:', event)
        } else {
          // 停止所有监听
          try {
            channel.stopListening('*', () => {})
            presenceChannel.stopListening('*', () => {})
          } catch {
            console.warn('WebSocket: Using alternative cleanup method')
          }
        }
      } catch (error) {
        console.error('WebSocket: Error stopping channels:', error)
      }
    },
    channel,
    presenceChannel,
  }
}

/**
 * 设置房间事件监听器
 */
export const setupRoomEventListeners = (
  channelWrapper: ReturnType<typeof createChannelWrapper>,
  roomId: string,
  onMessage?: (data: unknown) => void
): void => {
  if (!channelWrapper || typeof channelWrapper.listen !== 'function') {
    console.error('WebSocket: Channel reference is invalid - missing listen method')
    return
  }

  console.log('WebSocket: Setting up event listeners for room', roomId)

  const safeOnMessage = (data: unknown, type: string = 'message') => {
    if (onMessage && data) onMessage({ type, ...data })
  }

  channelWrapper.listen('.message.sent', (data: unknown) => {
    const typedData = data as { message?: unknown }
    if (typedData?.message) safeOnMessage({ message: typedData.message }, 'message')
  })

  channelWrapper.listen('user.joined', (data: unknown) => safeOnMessage(data, 'user_joined'))
  channelWrapper.listen('user.left', (data: unknown) => safeOnMessage(data, 'user_left'))

  channelWrapper.listen('Chat\\MessageSent', (data: unknown) => {
    const typedData = data as { message?: unknown }
    if (typedData?.message) safeOnMessage({ message: typedData.message }, 'message')
  })

  channelWrapper.listen('.', (data: unknown) => {
    const typedData = data as { message?: unknown }
    if (typedData?.message) {
      safeOnMessage({ message: typedData.message }, 'message')
    }
  })

  // 绑定系统事件
  if (typeof channelWrapper.bind === 'function') {
    channelWrapper.bind('pusher:subscription_succeeded', () => {
      console.log('WebSocket: Subscription succeeded for room', roomId)
    })
    channelWrapper.bind('pusher:subscription_error', () => {
      console.error('WebSocket: Subscription error for room', roomId)
    })
  }
}
