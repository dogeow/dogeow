'use client'

// 2025-09-24 claude-4-sonnet 优化过本文件代码：「优化代码」

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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
import type { ChatMessage, MessageData } from './types'
import './styles/chat-mobile.css'

// 通用空函数
const noop = () => {}

// 节流时间常量
const LOAD_THROTTLE_TIME = 5000
const CONNECTION_CHECK_INTERVAL = 100
const CONNECTION_TIMEOUT = 10000

function ChatPageContent() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading, token } = useAuthStore()
  const chatStore = useChatStore()
  const {
    currentRoom,
    retryLastAction,
    clearError,
    error: storeError,
    clearAllOnlineUsers,
    setConnectionStatus,
    addMessage,
    updateMuteStatus,
    updateRoomOnlineCount,
  } = chatStore

  // Refs 优化
  const hasLoadedInitialDataRef = useRef(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const lastLoadedRoomRef = useRef<number | null>(null)
  const loadThrottleTimersRef = useRef<Record<string, number>>({})

  // 移动端状态
  const [isRoomListOpen, setIsRoomListOpen] = useState(false)
  const [isUsersListOpen, setIsUsersListOpen] = useState(false)
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)

  // 错误处理
  const {
    error: componentError,
    handleError,
    clearError: clearComponentError,
    retryAction,
  } = useChatErrorHandler()

  // 缓存的函数 - 优化防重复加载逻辑
  const loadRooms = useCallback(() => useChatStore.getState().loadRooms(), [])

  const loadOnlineUsersThrottled = useCallback((roomId: number) => {
    const now = Date.now()
    const lastLoadKey = `room_${roomId}_last_load`
    const lastLoadTime = loadThrottleTimersRef.current[lastLoadKey] || 0

    if (now - lastLoadTime < LOAD_THROTTLE_TIME) {
      return Promise.resolve()
    }

    loadThrottleTimersRef.current[lastLoadKey] = now
    return useChatStore.getState().loadOnlineUsers(roomId)
  }, [])

  // WebSocket事件处理 - 使用 useMemo 优化
  const webSocketHandlers = useMemo(
    () => ({
      handleConnect: () => setConnectionStatus('connected'),

      handleDisconnect: () => {
        setConnectionStatus('disconnected')
        clearAllOnlineUsers()
      },

      handleWebSocketError: () => {
        setConnectionStatus('disconnected')
        clearAllOnlineUsers()
      },

      handleMessage: (data: unknown) => {
        const messageData = data as MessageData
        const currentUserId = useAuthStore.getState().user?.id

        switch (messageData.type) {
          case 'user_muted':
          case 'user_unmuted': {
            if (messageData.user_id === currentUserId) {
              updateMuteStatus(
                messageData.type === 'user_muted',
                messageData.muted_until,
                messageData.reason
              )
            }
            break
          }

          case 'user.joined.room':
          case 'user.left.room': {
            if (messageData.room_id && messageData.online_count !== undefined) {
              updateRoomOnlineCount(messageData.room_id, messageData.online_count)
            }
            break
          }

          case 'message': {
            if (messageData.message) {
              addMessage(messageData.message.room_id, messageData.message)
            }
            break
          }

          case 'user_joined':
          case 'user_left': {
            if (currentRoom) {
              loadOnlineUsersThrottled(currentRoom.id).catch(noop)
            }
            break
          }

          default:
            break
        }
      },
    }),
    [
      setConnectionStatus,
      clearAllOnlineUsers,
      updateMuteStatus,
      updateRoomOnlineCount,
      addMessage,
      currentRoom,
      loadOnlineUsersThrottled,
    ]
  )

  // 移动端处理函数 - 使用 useMemo 优化
  const mobileHandlers = useMemo(
    () => ({
      handleOpenRoomList: () => setIsRoomListOpen(true),
      handleOpenUsersList: () => setIsUsersListOpen(true),
      handleReply: (message: ChatMessage) => setReplyingTo(message),
      cancelReply: () => setReplyingTo(null),
    }),
    []
  )

  // 消息发送成功处理
  const handleMessageSentSuccess = useCallback(
    (messageData: unknown) => {
      const chatMessage = messageData as ChatMessage
      if (currentRoom) {
        addMessage(currentRoom.id, chatMessage)
      }
    },
    [currentRoom, addMessage]
  )

  // 认证令牌刷新回调
  const authTokenRefreshCallback = useCallback(() => Promise.resolve(token || null), [token])

  // WebSocket连接配置 - 使用 useMemo 优化
  const webSocketConfig = useMemo(
    () => ({
      autoConnect: false,
      onConnect: webSocketHandlers.handleConnect,
      onDisconnect: webSocketHandlers.handleDisconnect,
      onError: webSocketHandlers.handleWebSocketError,
      onMessage: webSocketHandlers.handleMessage,
      onOffline: noop,
      onOnline: noop,
      onMessageQueued: noop,
      onMessageSent: noop,
      onMessageFailed: noop,
      onMessageSentSuccess: handleMessageSentSuccess,
      authTokenRefreshCallback,
    }),
    [webSocketHandlers, handleMessageSentSuccess, authTokenRefreshCallback]
  )

  // WebSocket连接
  const {
    connect,
    joinRoom: wsJoinRoom,
    sendMessage,
    connectionInfo,
    offlineState,
    reconnect,
    retryFailedMessages,
    clearOfflineQueue,
  } = useChatWebSocket(webSocketConfig)

  // 鉴权检查
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, authLoading, router])

  // 禁用主容器滚动，让聊天区域独立处理滚动
  useEffect(() => {
    const mainContainer = document.getElementById('main-container')
    if (!mainContainer) return

    const previousOverflowY = mainContainer.style.overflowY

    // 禁用主容器的垂直滚动
    mainContainer.style.overflowY = 'hidden'

    return () => {
      // 离开页面时恢复
      mainContainer.style.overflowY = previousOverflowY
    }
  }, [])

  // 初始化聊天 - 优化错误处理
  useEffect(() => {
    if (!isAuthenticated || authLoading || hasLoadedInitialDataRef.current) return

    hasLoadedInitialDataRef.current = true

    const initializeChat = async () => {
      try {
        clearAllOnlineUsers()
        await loadRooms()

        // WebSocket连接失败不阻断初始化流程
        connect().catch(noop)
      } catch (error) {
        console.error('Chat initialization failed:', error)
        handleError(error as Error)
      }
    }

    initializeChat()
  }, [isAuthenticated, authLoading, connect, loadRooms, handleError, clearAllOnlineUsers])

  // 房间切换处理 - 优化连接状态检查
  useEffect(() => {
    if (!currentRoom || !isAuthenticated) return

    // 加载在线用户 - 避免重复请求
    if (lastLoadedRoomRef.current !== currentRoom.id) {
      lastLoadedRoomRef.current = currentRoom.id
      loadOnlineUsersThrottled(currentRoom.id).catch(handleError)
    }

    // 加入WebSocket房间的统一处理函数
    const joinRoom = () => wsJoinRoom(currentRoom.id.toString())

    // 如果已连接，直接加入房间
    if (connectionInfo.status === 'connected') {
      joinRoom()
      return
    }

    // 如果正在连接，等待连接建立
    if (connectionInfo.status === 'connecting') {
      const checkInterval = setInterval(() => {
        const currentStatus = useChatStore.getState().connectionStatus
        if (currentStatus === 'connected') {
          clearInterval(checkInterval)
          joinRoom()
        }
      }, CONNECTION_CHECK_INTERVAL)

      const timeout = setTimeout(() => {
        clearInterval(checkInterval)
      }, CONNECTION_TIMEOUT)

      return () => {
        clearInterval(checkInterval)
        clearTimeout(timeout)
      }
    }
  }, [
    currentRoom,
    isAuthenticated,
    connectionInfo.status,
    wsJoinRoom,
    handleError,
    loadOnlineUsersThrottled,
  ])

  // 渲染逻辑优化
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
      <div className="bg-background safe-area-top safe-area-bottom flex h-[calc(100vh-50px)] min-h-0 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 overflow-hidden">
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
          <div className="flex min-h-0 flex-1 flex-col">
            {/* Mobile Sheets - 房间列表和用户列表（无房间时也可打开房间列表） */}
            <MobileSheets
              isRoomListOpen={isRoomListOpen}
              isUsersListOpen={isUsersListOpen}
              currentRoom={currentRoom}
              onRoomListOpenChange={setIsRoomListOpen}
              onUsersListOpenChange={setIsUsersListOpen}
              onMentionUser={noop}
              onDirectMessage={noop}
              onBlockUser={noop}
              onReportUser={noop}
            />

            {currentRoom ? (
              <>
                {/* Chat Header - 桌面端和移动端 */}
                <div className="hidden flex-none lg:block">
                  <ChatHeader room={currentRoom} showBackButton={false} />
                </div>
                <div className="chat-header-container flex-none lg:hidden">
                  <ChatHeader
                    room={currentRoom}
                    showBackButton={false}
                    onOpenRoomList={mobileHandlers.handleOpenRoomList}
                    onOpenUsersList={mobileHandlers.handleOpenUsersList}
                  />
                </div>

                {/* Messages - 优化移动端高度 */}
                <div
                  ref={scrollContainerRef}
                  className="chat-messages-mobile min-h-0 flex-1 overflow-y-auto"
                >
                  <MessageList roomId={currentRoom.id} onReply={mobileHandlers.handleReply} />
                </div>

                {/* Message Input */}
                <div className="chat-input-area-mobile flex-none">
                  <MessageInput
                    roomId={currentRoom.id}
                    replyingTo={replyingTo}
                    onCancelReply={mobileHandlers.cancelReply}
                    sendMessage={sendMessage}
                    isConnected={connectionInfo.status === 'connected'}
                    scrollContainerRef={scrollContainerRef}
                  />
                </div>
              </>
            ) : (
              <ChatWelcome onOpenRoomList={mobileHandlers.handleOpenRoomList} />
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
            onMentionUser={noop}
            onDirectMessage={noop}
            onBlockUser={noop}
            onReportUser={noop}
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
