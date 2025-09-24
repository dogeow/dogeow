'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  MessageList,
  MessageInput,
  ChatHeader,
  ChatSidebar,
  MobileSheets,
  ChatErrorHandler,
  ChatWelcome,
  ChatPageSkeleton,
} from './components'
import ChatErrorBoundary, { useChatErrorHandler } from './components/ChatErrorBoundary'
import useChatStore from '@/app/chat/chatStore'
import useAuthStore from '@/stores/authStore'
import { useChatWebSocket } from '@/hooks/useChatWebSocket'
import type { ChatMessage, MessageData, MuteData, RoomUserEventData, PresenceData } from './types'
import './styles/chat-mobile.css'

function ChatPageContent() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading, token } = useAuthStore()
  const {
    currentRoom,
    loadOnlineUsers,
    setConnectionStatus,
    addMessage,
    retryLastAction,
    clearError,
    error: storeError,
    updateMuteStatus,
    updateRoomOnlineCount,
    clearAllOnlineUsers,
  } = useChatStore()

  // 优化：使用useMemo缓存loadRooms函数
  const loadRooms = useMemo(() => () => useChatStore.getState().loadRooms(), [])
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
  const [isRoomListOpen, setIsRoomListOpen] = useState(false)
  const [isUsersListOpen, setIsUsersListOpen] = useState(false)
  const hasLoadedInitialDataRef = useRef(false)

  // 滚动容器引用，用于未读消息指示器
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // 错误处理
  const {
    error: componentError,
    handleError,
    clearError: clearComponentError,
    retryAction,
  } = useChatErrorHandler()

  // WebSocket 相关回调
  const handleConnect = useCallback(() => setConnectionStatus('connected'), [setConnectionStatus])

  // 优化：提取清理在线用户数据的逻辑
  const clearOnlineUsersOnDisconnect = useCallback(() => {
    console.log('🔥 ChatPage: 清理在线用户数据')
    clearAllOnlineUsers()
  }, [clearAllOnlineUsers])

  const handleDisconnect = useCallback(async () => {
    console.log('🔥 ChatPage: WebSocket断开连接，清理在线用户数据')
    setConnectionStatus('disconnected')

    // 注意：WebSocket断开连接时不主动调用leaveRoom API
    // 因为用户可能只是网络暂时断开，而不是真正想离开房间
    // leaveRoom API 应该只在用户主动切换房间或页面卸载时调用

    clearOnlineUsersOnDisconnect() // 断开连接时清空所有在线用户数据
  }, [setConnectionStatus, clearOnlineUsersOnDisconnect])

  const handleWebSocketError = useCallback(() => {
    console.log('🔥 ChatPage: WebSocket连接错误，清理在线用户数据')
    setConnectionStatus('disconnected')
    clearOnlineUsersOnDisconnect() // 连接错误时也清空在线用户数据
  }, [setConnectionStatus, clearOnlineUsersOnDisconnect])

  // 优化：提取消息处理逻辑到单独的函数
  const handleMuteStatusUpdate = useCallback(
    (messageData: MessageData) => {
      if (messageData.type === 'user_muted') {
        const muteData = messageData as MuteData
        // 检查是否是当前用户被静音
        if (muteData.user_id === useAuthStore.getState().user?.id) {
          updateMuteStatus(true, muteData.muted_until, muteData.reason)
        }
        return true
      }

      if (messageData.type === 'user_unmuted') {
        const unmuteData = messageData as MuteData
        // 检查是否是当前用户被取消静音
        if (unmuteData.user_id === useAuthStore.getState().user?.id) {
          updateMuteStatus(false)
        }
        return true
      }
      return false
    },
    [updateMuteStatus]
  )

  const handleRoomUserEvents = useCallback(
    (messageData: MessageData) => {
      if (messageData.type === 'user.joined.room') {
        const joinData = messageData as RoomUserEventData
        console.log('🔥 ChatPage: User joined room:', joinData)
        updateRoomOnlineCount(joinData.room_id, joinData.online_count)
        return true
      }

      if (messageData.type === 'user.left.room') {
        const leaveData = messageData as RoomUserEventData
        console.log('🔥 ChatPage: User left room:', leaveData)
        updateRoomOnlineCount(leaveData.room_id, leaveData.online_count)
        return true
      }
      return false
    },
    [updateRoomOnlineCount]
  )

  const handlePresenceEvents = useCallback((messageData: MessageData) => {
    if (messageData.action === 'here') {
      const presenceData = messageData as unknown as PresenceData
      console.log('🔥 ChatPage: Users currently in room (Presence):', presenceData.users)
      // 可以在这里更新在线用户列表
      return true
    }

    if (messageData.action === 'joining') {
      const joiningData = messageData as unknown as PresenceData
      console.log('🔥 ChatPage: User joining (Presence):', joiningData.user)
      return true
    }

    if (messageData.action === 'leaving') {
      const leavingData = messageData as unknown as PresenceData
      console.log('🔥 ChatPage: User leaving (Presence):', leavingData.user)
      return true
    }
    return false
  }, [])

  const handleMessageReceived = useCallback(
    (messageData: MessageData) => {
      if (messageData.type === 'message' && messageData.message) {
        // 直接使用消息中的 room_id，而不依赖 currentRoom 状态
        const roomId = messageData.message.room_id
        console.log('🔥 ChatPage: 正在向房间添加消息：', roomId, messageData.message)
        console.log('🔥 ChatPage: 消息详情：', {
          id: messageData.message.id,
          room_id: messageData.message.room_id,
          message: messageData.message.message,
          user: messageData.message.user.name,
        })

        // 检查store状态
        const beforeMessages = useChatStore.getState().messages
        console.log('🔥 ChatPage: 添加消息前的store状态：', {
          所有房间keys: Object.keys(beforeMessages),
          目标房间消息数: beforeMessages[roomId.toString()]?.length || 0,
        })

        addMessage(roomId, messageData.message)

        // 检查store状态
        const afterMessages = useChatStore.getState().messages
        console.log('🔥 ChatPage: 添加消息后的store状态：', {
          所有房间keys: Object.keys(afterMessages),
          目标房间消息数: afterMessages[roomId.toString()]?.length || 0,
        })

        console.log('🔥 ChatPage: 消息添加成功')
        return true
      }
      return false
    },
    [addMessage]
  )

  const handleUserEvents = useCallback(
    (messageData: MessageData) => {
      if ((messageData.type === 'user_joined' || messageData.type === 'user_left') && currentRoom) {
        console.log('ChatPage: 用户事件，正在重新加载在线用户')
        loadOnlineUsers(currentRoom.id).catch(() => {})
        return true
      }
      return false
    },
    [currentRoom, loadOnlineUsers]
  )

  const handleMessage = useCallback(
    (data: unknown) => {
      const messageData = data as MessageData
      console.log('🔥 ChatPage: handleMessage 被调用，参数为：', messageData)
      console.log('🔥 ChatPage: 当前房间：', currentRoom)

      // 按优先级处理不同类型的消息
      if (
        handleMuteStatusUpdate(messageData) ||
        handleRoomUserEvents(messageData) ||
        handlePresenceEvents(messageData) ||
        handleMessageReceived(messageData) ||
        handleUserEvents(messageData)
      ) {
        return
      }

      // 未处理的消息
      console.warn('❌ ChatPage: 消息未被处理：', {
        type: messageData.type,
        hasCurrentRoom: !!currentRoom,
        hasMessage: !!messageData.message,
        messageRoomId: messageData.message?.room_id,
        data: messageData,
      })
    },
    [
      currentRoom,
      handleMuteStatusUpdate,
      handleRoomUserEvents,
      handlePresenceEvents,
      handleMessageReceived,
      handleUserEvents,
    ]
  )

  // 其他 WebSocket 事件（如离线、在线、消息队列等）可根据需要精简
  // 优化：使用空函数常量避免重复创建
  const emptyHandler = useCallback(() => {}, [])
  const handleOffline = emptyHandler
  const handleOnline = emptyHandler
  const handleMessageQueued = emptyHandler
  const handleMessageSent = emptyHandler
  const handleMessageFailed = emptyHandler

  const handleMessageSentSuccess = useCallback(
    (messageData: unknown) => {
      const chatMessage = messageData as ChatMessage
      if (currentRoom) {
        addMessage(currentRoom.id, chatMessage)
      }
    },
    [currentRoom, addMessage]
  )

  // 优化：简化token回调
  const authTokenRefreshCallback = useCallback(() => Promise.resolve(token || null), [token])

  // WebSocket 连接
  const {
    connect,
    joinRoom: wsJoinRoom,
    sendMessage,
    connectionInfo,
    offlineState,
    reconnect,
    retryFailedMessages,
    clearOfflineQueue,
  } = useChatWebSocket({
    autoConnect: false,
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
    onError: handleWebSocketError,
    onMessage: handleMessage,
    onOffline: handleOffline,
    onOnline: handleOnline,
    onMessageQueued: handleMessageQueued,
    onMessageSent: handleMessageSent,
    onMessageFailed: handleMessageFailed,
    onMessageSentSuccess: handleMessageSentSuccess,
    authTokenRefreshCallback,
  })

  // 鉴权跳转
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, authLoading, router])

  // 首次加载房间和连接 WebSocket
  useEffect(() => {
    console.log('🔥 ChatPage: Initialization effect triggered:', {
      isAuthenticated,
      authLoading,
      hasLoadedInitialData: hasLoadedInitialDataRef.current,
    })

    if (isAuthenticated && !authLoading && !hasLoadedInitialDataRef.current) {
      hasLoadedInitialDataRef.current = true
      console.log('🔥 ChatPage: Initializing chat - loading rooms and connecting WebSocket')

      // 初始化时清理所有在线用户数据，确保显示正确
      clearAllOnlineUsers()

      // 优化：提取初始化逻辑到单独函数
      const initializeChat = async () => {
        try {
          await Promise.all([loadRooms(), connect()])
          console.log('🔥 ChatPage: Initialization completed')
        } catch (error) {
          console.error('🔥 ChatPage: Initialization failed:', error)
          handleError(error as Error)
        }
      }

      initializeChat()

      // 如果连接失败，尝试备用连接（但不修改状态，避免无限循环）
      setTimeout(() => {
        const currentStatus = useChatStore.getState().connectionStatus
        if (currentStatus !== 'connected') {
          console.log('🔥 ChatPage: 连接失败，尝试备用连接')
          // 直接创建Echo实例作为备用方案
          import('@/lib/websocket/echo').then(({ createEchoInstance }) => {
            const echo = createEchoInstance()
            if (echo) {
              console.log('🔥 ChatPage: 备用连接成功')
              // 不直接修改状态，让WebSocket hook自动管理连接状态
            }
          })
        }
      }, 2000)
    }
  }, [isAuthenticated, authLoading, connect, loadRooms, handleError, clearAllOnlineUsers])

  // 房间切换时加载在线用户并加入 WebSocket 房间
  useEffect(() => {
    console.log('🔥 ChatPage: 房间/连接副作用触发：', {
      当前房间: currentRoom?.id,
      是否已认证: isAuthenticated,
      连接状态: connectionInfo.status,
      wsJoinRoom函数是否存在: !!wsJoinRoom,
    })

    if (currentRoom && isAuthenticated) {
      // 无论连接状态如何，都先加载在线用户（从API获取）
      console.log('🔥 ChatPage: 加载在线用户：', currentRoom.id)
      loadOnlineUsers(currentRoom.id).catch(handleError)

      // 优化：提取房间加入逻辑
      const joinRoomIfConnected = () => {
        console.log('🔥 ChatPage: 连接已建立，加入WebSocket房间：', currentRoom.id)
        try {
          wsJoinRoom(currentRoom.id.toString())
          console.log('🔥 ChatPage: WebSocket joinRoom已调用，房间：', currentRoom.id)
        } catch (error) {
          console.error('🔥 ChatPage: WebSocket joinRoom失败：', error)
          handleError(error as Error)
        }
      }

      // 如果已连接，立即加入WebSocket房间
      if (connectionInfo.status === 'connected') {
        joinRoomIfConnected()
      } else if (connectionInfo.status === 'connecting') {
        console.log('🔥 ChatPage: 连接中，等待连接建立后加入房间：', currentRoom.id)
        // 设置一个监听器，当连接建立时自动加入房间
        const checkConnection = setInterval(() => {
          // 从store获取最新的连接状态
          const currentStatus = useChatStore.getState().connectionStatus
          if (currentStatus === 'connected') {
            clearInterval(checkConnection)
            joinRoomIfConnected()
          }
        }, 100)

        // 10秒后清除检查，避免无限循环
        const timeout = setTimeout(() => {
          clearInterval(checkConnection)
        }, 10000)

        return () => {
          clearInterval(checkConnection)
          clearTimeout(timeout)
        }
      } else {
        console.log('🔥 ChatPage: 连接未建立，状态：', connectionInfo.status)
        // 如果连接状态为disconnected，记录日志但不强制修改状态
        console.log('🔥 ChatPage: 连接状态为disconnected，等待WebSocket自动重连...')
      }
    } else {
      console.log('🔥 ChatPage: 未加入房间，原因：', {
        是否有当前房间: !!currentRoom,
        是否已认证: isAuthenticated,
        连接状态: connectionInfo.status,
      })
    }
  }, [
    currentRoom,
    isAuthenticated,
    connectionInfo.status,
    loadOnlineUsers,
    wsJoinRoom,
    handleError,
  ])

  // 处理消息回复
  const handleReply = (message: ChatMessage) => setReplyingTo(message)

  // 移动端回调函数
  const handleOpenRoomList = useCallback(() => {
    console.log('Opening room list')
    setIsRoomListOpen(true)
  }, [])

  const handleOpenUsersList = useCallback(() => {
    console.log('Opening users list')
    setIsUsersListOpen(true)
  }, [])

  if (authLoading) return <ChatPageSkeleton />
  if (!isAuthenticated) return null

  return (
    <ChatErrorHandler
      storeError={storeError}
      componentError={componentError}
      retryLastAction={retryLastAction}
      clearError={clearError}
      clearComponentError={clearComponentError}
      retryAction={retryAction}
    >
      <div className="bg-background safe-area-top safe-area-bottom flex h-full flex-col">
        {/* Desktop Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Room List Sidebar - Desktop */}
          <ChatSidebar
            type="rooms"
            currentRoom={currentRoom}
            connectionInfo={connectionInfo}
            offlineState={offlineState}
            onReconnect={reconnect}
            onRetryMessages={retryFailedMessages}
            onClearQueue={clearOfflineQueue}
          />

          {/* Main Chat Area */}
          <div className="flex flex-1 flex-col">
            {currentRoom ? (
              <>
                {/* Chat Header - 桌面端 */}
                <div className="hidden lg:block">
                  <ChatHeader room={currentRoom} showBackButton={false} />
                </div>

                {/* Chat Header - 移动端 */}
                <div className="chat-header-container lg:hidden">
                  <ChatHeader
                    room={currentRoom}
                    showBackButton={false}
                    onOpenRoomList={handleOpenRoomList}
                    onOpenUsersList={handleOpenUsersList}
                  />
                </div>

                {/* Mobile Sheets - 房间列表和用户列表 */}
                <MobileSheets
                  isRoomListOpen={isRoomListOpen}
                  isUsersListOpen={isUsersListOpen}
                  currentRoom={currentRoom}
                  onRoomListOpenChange={setIsRoomListOpen}
                  onUsersListOpenChange={setIsUsersListOpen}
                  onMentionUser={emptyHandler}
                  onDirectMessage={emptyHandler}
                  onBlockUser={emptyHandler}
                  onReportUser={emptyHandler}
                />

                {/* Messages - 优化移动端高度 */}
                <div ref={scrollContainerRef} className="chat-messages-mobile min-h-0 flex-1">
                  <MessageList roomId={currentRoom.id} onReply={handleReply} />
                </div>

                {/* Message Input */}
                <div className="chat-input-area-mobile">
                  <MessageInput
                    roomId={currentRoom.id}
                    replyingTo={replyingTo}
                    onCancelReply={() => setReplyingTo(null)}
                    sendMessage={sendMessage}
                    isConnected={connectionInfo.status === 'connected'}
                    scrollContainerRef={scrollContainerRef}
                  />
                </div>
              </>
            ) : (
              <ChatWelcome />
            )}
          </div>

          {/* Online Users Sidebar - Desktop */}
          <ChatSidebar
            type="users"
            currentRoom={currentRoom}
            connectionInfo={connectionInfo}
            offlineState={offlineState}
            onReconnect={reconnect}
            onRetryMessages={retryFailedMessages}
            onClearQueue={clearOfflineQueue}
            onMentionUser={emptyHandler}
            onDirectMessage={emptyHandler}
            onBlockUser={emptyHandler}
            onReportUser={emptyHandler}
          />
        </div>
      </div>
    </ChatErrorHandler>
  )
}

export default function ChatPage() {
  return (
    <ChatErrorBoundary>
      <ChatPageContent />
    </ChatErrorBoundary>
  )
}
