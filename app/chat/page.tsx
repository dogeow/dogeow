'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { UsersIcon, MessageSquareIcon } from 'lucide-react'
import { ChatRoomList, MessageList, MessageInput, OnlineUsers, ChatHeader } from './components'
import ConnectionStatusIndicator from './components/ConnectionStatusIndicator'
import ChatErrorBoundary, { useChatErrorHandler } from './components/ChatErrorBoundary'
import ErrorFallback from './components/ErrorFallback'
import useChatStore from '@/app/chat/chatStore'
import useAuthStore from '@/stores/authStore'
import { useChatWebSocket } from '@/hooks/useChatWebSocket'
import type { ChatMessage } from './types'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useTranslation } from '@/hooks/useTranslation'
import './styles/chat-mobile.css'

function ChatPageContent() {
  const router = useRouter()
  const { t } = useTranslation()
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

  const loadRooms = useCallback(() => useChatStore.getState().loadRooms(), [])
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
  const handleDisconnect = useCallback(async () => {
    console.log('🔥 ChatPage: WebSocket断开连接，清理在线用户数据')
    setConnectionStatus('disconnected')

    // 注意：WebSocket断开连接时不主动调用leaveRoom API
    // 因为用户可能只是网络暂时断开，而不是真正想离开房间
    // leaveRoom API 应该只在用户主动切换房间或页面卸载时调用

    clearAllOnlineUsers() // 断开连接时清空所有在线用户数据
  }, [setConnectionStatus, clearAllOnlineUsers])
  const handleWebSocketError = useCallback(() => {
    console.log('🔥 ChatPage: WebSocket连接错误，清理在线用户数据')
    setConnectionStatus('disconnected')
    clearAllOnlineUsers() // 连接错误时也清空在线用户数据
  }, [setConnectionStatus, clearAllOnlineUsers])

  const handleMessage = useCallback(
    (data: unknown) => {
      const messageData = data as { type: string; message?: ChatMessage; [key: string]: unknown }
      console.log('🔥 ChatPage: handleMessage 被调用，参数为：', messageData)
      console.log('🔥 ChatPage: 当前房间：', currentRoom)

      // 处理静音状态更新
      if (messageData.type === 'user_muted') {
        const muteData = messageData as {
          type: string
          user_id: number
          room_id: number
          muted_until?: string
          reason?: string
        }
        // 检查是否是当前用户被静音
        if (muteData.user_id === useAuthStore.getState().user?.id) {
          updateMuteStatus(true, muteData.muted_until, muteData.reason)
        }
        return
      }

      if (messageData.type === 'user_unmuted') {
        const unmuteData = messageData as {
          type: string
          user_id: number
          room_id: number
        }
        // 检查是否是当前用户被取消静音
        if (unmuteData.user_id === useAuthStore.getState().user?.id) {
          updateMuteStatus(false)
        }
        return
      }

      // 处理用户加入房间事件
      if (messageData.type === 'user.joined.room') {
        const joinData = messageData as {
          type: string
          room_id: number
          user_id: number
          user_name: string
          online_count: number
          action: string
          timestamp: string
        }
        console.log('🔥 ChatPage: User joined room:', joinData)
        updateRoomOnlineCount(joinData.room_id, joinData.online_count)
        return
      }

      // 处理用户离开房间事件
      if (messageData.type === 'user.left.room') {
        const leaveData = messageData as {
          type: string
          room_id: number
          user_id: number
          user_name: string
          online_count: number
          action: string
          timestamp: string
        }
        console.log('🔥 ChatPage: User left room:', leaveData)
        updateRoomOnlineCount(leaveData.room_id, leaveData.online_count)
        return
      }

      // 处理 Presence Channel 事件
      if (messageData.action === 'here') {
        const presenceData = messageData as unknown as {
          action: string
          users: Array<{
            id: number
            name: string
            email: string
            avatar?: string
          }>
        }
        console.log('🔥 ChatPage: Users currently in room (Presence):', presenceData.users)
        // 可以在这里更新在线用户列表
        return
      }

      if (messageData.action === 'joining') {
        const joiningData = messageData as unknown as {
          action: string
          user: {
            id: number
            name: string
            email: string
            avatar?: string
          }
        }
        console.log('🔥 ChatPage: User joining (Presence):', joiningData.user)
        return
      }

      if (messageData.action === 'leaving') {
        const leavingData = messageData as unknown as {
          action: string
          user: {
            id: number
            name: string
            email: string
            avatar?: string
          }
        }
        console.log('🔥 ChatPage: User leaving (Presence):', leavingData.user)
        return
      }

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
      } else if (
        (messageData.type === 'user_joined' || messageData.type === 'user_left') &&
        currentRoom
      ) {
        console.log('ChatPage: 用户事件，正在重新加载在线用户')
        loadOnlineUsers(currentRoom.id).catch(() => {})
      } else {
        console.warn('❌ ChatPage: 消息未被处理：', {
          type: messageData.type,
          hasCurrentRoom: !!currentRoom,
          hasMessage: !!messageData.message,
          messageRoomId: messageData.message?.room_id,
          data: messageData,
        })
      }
    },
    [currentRoom, addMessage, loadOnlineUsers, updateMuteStatus, updateRoomOnlineCount]
  )

  // 其他 WebSocket 事件（如离线、在线、消息队列等）可根据需要精简
  const handleOffline = useCallback(() => {}, [])
  const handleOnline = useCallback(() => {}, [])
  const handleMessageQueued = useCallback(() => {}, [])
  const handleMessageSent = useCallback(() => {}, [])
  const handleMessageFailed = useCallback(() => {}, [])

  const handleMessageSentSuccess = useCallback(
    (messageData: unknown) => {
      const chatMessage = messageData as ChatMessage
      if (currentRoom) {
        addMessage(currentRoom.id, chatMessage)
      }
    },
    [currentRoom, addMessage]
  )

  const authTokenRefreshCallback = useCallback(async () => token || null, [token])

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

      // 并行加载房间和连接WebSocket
      Promise.all([
        loadRooms().catch(error => {
          console.error('🔥 ChatPage: Failed to load rooms:', error)
          handleError(error)
        }),
        connect().catch(error => {
          console.error('🔥 ChatPage: Failed to connect WebSocket:', error)
          handleError(error)
        }),
      ]).then(() => {
        console.log('🔥 ChatPage: Initialization completed')

        // 如果连接失败，尝试备用连接
        setTimeout(() => {
          if (connectionInfo.status !== 'connected') {
            console.log('🔥 ChatPage: 连接失败，尝试备用连接')
            // 直接创建Echo实例作为备用方案
            import('@/lib/websocket/echo').then(({ createEchoInstance }) => {
              const echo = createEchoInstance()
              if (echo) {
                console.log('🔥 ChatPage: 备用连接成功')
                setConnectionStatus('connected')
              }
            })
          }
        }, 2000)
      })
    }
  }, [
    isAuthenticated,
    authLoading,
    connect,
    loadRooms,
    handleError,
    clearAllOnlineUsers,
    connectionInfo.status,
    setConnectionStatus,
  ])

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

      // 如果已连接，立即加入WebSocket房间
      if (connectionInfo.status === 'connected') {
        console.log('🔥 ChatPage: 连接已建立，加入WebSocket房间：', currentRoom.id)
        try {
          wsJoinRoom(currentRoom.id.toString())
          console.log('🔥 ChatPage: WebSocket joinRoom已调用，房间：', currentRoom.id)
        } catch (error) {
          console.error('🔥 ChatPage: WebSocket joinRoom失败：', error)
          handleError(error as Error)
        }
      } else if (connectionInfo.status === 'connecting') {
        console.log('🔥 ChatPage: 连接中，等待连接建立后加入房间：', currentRoom.id)
        // 设置一个监听器，当连接建立时自动加入房间
        const checkConnection = setInterval(() => {
          // 从store获取最新的连接状态
          const currentStatus = useChatStore.getState().connectionStatus
          if (currentStatus === 'connected') {
            clearInterval(checkConnection)
            try {
              wsJoinRoom(currentRoom.id.toString())
              console.log('🔥 ChatPage: 连接建立后自动加入WebSocket房间：', currentRoom.id)
            } catch (error) {
              console.error('🔥 ChatPage: 自动加入WebSocket房间失败：', error)
              handleError(error as Error)
            }
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
        // 如果连接状态为disconnected，尝试强制同步状态
        console.log('🔥 ChatPage: 连接状态为disconnected，尝试强制同步...')
        setTimeout(() => {
          setConnectionStatus('connected')
          console.log('🔥 ChatPage: 强制同步连接状态为connected')
        }, 1000)
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
    setConnectionStatus,
  ])

  // 处理消息回复
  const handleReply = (message: ChatMessage) => setReplyingTo(message)

  // 错误重试与清除
  const handleRetryError = () => {
    if (storeError) {
      retryAction(() => retryLastAction())
      clearError()
    }
    if (componentError) {
      clearComponentError()
    }
  }
  const handleClearError = () => {
    clearError()
    clearComponentError()
  }

  // 错误优先级处理
  const currentError = storeError || componentError
  if (currentError && (currentError.type === 'authentication' || currentError.type === 'server')) {
    return (
      <ErrorFallback
        error={currentError}
        onRetry={handleRetryError}
        onClearError={handleClearError}
        variant="full"
      />
    )
  }

  if (authLoading) return <ChatPageSkeleton />
  if (!isAuthenticated) return null

  return (
    <div className="bg-background safe-area-top safe-area-bottom flex h-full flex-col">
      {/* Error Banner */}
      {currentError && currentError.type !== 'authentication' && currentError.type !== 'server' && (
        <div className="border-b">
          <ErrorFallback
            error={currentError}
            onRetry={handleRetryError}
            onClearError={handleClearError}
            variant="inline"
            className="m-4"
          />
        </div>
      )}

      {/* Desktop Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Room List Sidebar - Desktop */}
        <div className="bg-muted/30 hidden w-80 border-r lg:flex lg:flex-col">
          <div className="border-b p-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold">
                <MessageSquareIcon className="h-5 w-5" />
                {t('chat.chat_rooms', 'Chat Rooms')}
              </h2>
              {/* Connection Status - Desktop - 放在同一行 */}
              <ConnectionStatusIndicator
                connectionInfo={connectionInfo}
                offlineState={offlineState}
                onReconnect={reconnect}
                onRetryMessages={retryFailedMessages}
                onClearQueue={clearOfflineQueue}
                className="relative"
              />
            </div>
          </div>
          {/* Room List Content */}
          <div className="flex-1 overflow-hidden">
            <ChatRoomList showHeader={false} />
          </div>
        </div>

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
                  onOpenRoomList={() => {
                    console.log('Opening room list')
                    setIsRoomListOpen(true)
                  }}
                  onOpenUsersList={() => {
                    console.log('Opening users list')
                    setIsUsersListOpen(true)
                  }}
                />
              </div>

              {/* Mobile Sheets - 房间列表和用户列表 */}
              <div className="lg:hidden">
                {/* 房间列表 Sheet */}
                <Sheet open={isRoomListOpen} onOpenChange={setIsRoomListOpen}>
                  <SheetContent side="left" className="w-80 p-0">
                    <SheetHeader className="border-b p-4">
                      <SheetTitle className="flex items-center gap-2">
                        <MessageSquareIcon className="h-5 w-5" />
                        {t('chat.chat_rooms', 'Chat Rooms')}
                      </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-hidden">
                      <ChatRoomList
                        onRoomSelect={() => setIsRoomListOpen(false)}
                        showHeader={false}
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* 用户列表 Sheet */}
                {currentRoom && (
                  <Sheet open={isUsersListOpen} onOpenChange={setIsUsersListOpen}>
                    <SheetContent side="right" className="w-80 p-0">
                      <SheetHeader className="border-b p-4">
                        <SheetTitle className="flex items-center gap-2">
                          <UsersIcon className="h-5 w-5" />
                          {t('chat.online_users_title', 'Online Users')}
                        </SheetTitle>
                      </SheetHeader>
                      <div className="flex-1 overflow-hidden">
                        <OnlineUsers
                          roomId={currentRoom.id}
                          onMentionUser={() => setIsUsersListOpen(false)}
                          onDirectMessage={() => setIsUsersListOpen(false)}
                          onBlockUser={() => {}}
                          onReportUser={() => {}}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>
                )}
              </div>

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
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <MessageSquareIcon className="text-muted-foreground/50 mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-medium">{t('chat.welcome', 'Welcome to Chat')}</h3>
                <p className="text-muted-foreground mt-2">
                  {t('chat.select_room', 'Select a room to start chatting or create a new one')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Online Users Sidebar - Desktop */}
        <div className="bg-muted/30 hidden w-80 border-l lg:flex lg:flex-col">
          <div className="border-b p-4">
            <h2 className="flex items-center gap-2 font-semibold">
              <UsersIcon className="h-5 w-5" />
              {t('chat.online_users_title', 'Online Users')}
            </h2>
          </div>
          <div className="flex-1 overflow-hidden">
            {currentRoom ? (
              <OnlineUsers
                roomId={currentRoom.id}
                onMentionUser={() => {}}
                onDirectMessage={() => {}}
                onBlockUser={() => {}}
                onReportUser={() => {}}
              />
            ) : (
              <div className="flex items-center justify-center p-4">
                <p className="text-muted-foreground text-center text-sm">
                  {t('chat.select_room_to_see_users', 'Select a room to see online users')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <ChatErrorBoundary>
      <ChatPageContent />
    </ChatErrorBoundary>
  )
}

// 聊天页面骨架屏
function ChatPageSkeleton() {
  return (
    <div className="bg-background safe-area-top safe-area-bottom flex h-full flex-col">
      {/* Mobile Header Skeleton */}
      <div className="chat-header-mobile flex items-center justify-between border-b p-4 lg:hidden">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9" />
          <div className="flex-1">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="mt-1 h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-9 w-9" />
      </div>

      {/* Desktop Layout Skeleton */}
      <div className="flex flex-1 overflow-hidden">
        {/* Room List Sidebar Skeleton */}
        <div className="bg-muted/30 hidden w-80 border-r lg:flex lg:flex-col">
          <div className="border-b p-4">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex-1 p-4">
            <RoomListSkeleton />
          </div>
        </div>

        {/* Main Chat Area Skeleton */}
        <div className="flex flex-1 flex-col">
          <div className="hidden border-b p-4 lg:block">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <Skeleton className="mx-auto h-12 w-12 rounded-full" />
              <Skeleton className="mt-4 h-6 w-48" />
              <Skeleton className="mt-2 h-4 w-64" />
            </div>
          </div>
        </div>

        {/* Online Users Sidebar Skeleton */}
        <div className="bg-muted/30 hidden w-80 border-l lg:flex lg:flex-col">
          <div className="border-b p-4">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex-1 p-4">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 房间列表骨架屏
function RoomListSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/2" />
          <div className="mt-2 flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  )
}
