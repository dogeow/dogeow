'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MenuIcon, UsersIcon, MessageSquareIcon } from 'lucide-react'
import { ChatRoomList, MessageList, MessageInput, OnlineUsers, ChatHeader } from './components'
import ConnectionStatusIndicator from './components/ConnectionStatusIndicator'
import ChatErrorBoundary, { useChatErrorHandler } from './components/ChatErrorBoundary'
import ErrorFallback from './components/ErrorFallback'
import useChatStore from '@/stores/chatStore'
import useAuthStore from '@/stores/authStore'
import { useChatWebSocket } from '@/hooks/useChatWebSocket'
import type { ChatMessage } from '@/types/chat'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

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
  } = useChatStore()

  // 保证 loadRooms 引用稳定
  const loadRooms = useCallback(() => useChatStore.getState().loadRooms(), [])
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
  const [isRoomListOpen, setIsRoomListOpen] = useState(false)
  const [isUsersListOpen, setIsUsersListOpen] = useState(false)
  const hasLoadedInitialDataRef = useRef(false)

  // 错误处理
  const {
    error: componentError,
    handleError,
    clearError: clearComponentError,
    retryAction,
  } = useChatErrorHandler()

  // WebSocket 相关回调
  const handleConnect = useCallback(() => setConnectionStatus('connected'), [setConnectionStatus])
  const handleDisconnect = useCallback(
    () => setConnectionStatus('disconnected'),
    [setConnectionStatus]
  )
  const handleWebSocketError = useCallback(() => {
    setConnectionStatus('disconnected')
    // 可以考虑上报 error
  }, [setConnectionStatus])

  const handleMessage = useCallback(
    (data: { type: string; message?: ChatMessage; [key: string]: unknown }) => {
      console.log('🔥 ChatPage: handleMessage called with:', data)
      console.log('🔥 ChatPage: Current room:', currentRoom)

      if (data.type === 'message' && data.message) {
        // 直接使用消息中的 room_id，而不依赖 currentRoom 状态
        const roomId = data.message.room_id
        console.log('🔥 ChatPage: Adding message to room:', roomId, data.message)
        console.log('🔥 ChatPage: Message details:', {
          id: data.message.id,
          room_id: data.message.room_id,
          message: data.message.message,
          user: data.message.user.name,
        })

        // 检查store状态
        const beforeMessages = useChatStore.getState().messages
        console.log('🔥 ChatPage: Store before addMessage:', {
          allRoomKeys: Object.keys(beforeMessages),
          targetRoomMessages: beforeMessages[roomId.toString()]?.length || 0,
        })

        addMessage(roomId, data.message)

        // 检查store状态
        const afterMessages = useChatStore.getState().messages
        console.log('🔥 ChatPage: Store after addMessage:', {
          allRoomKeys: Object.keys(afterMessages),
          targetRoomMessages: afterMessages[roomId.toString()]?.length || 0,
        })

        console.log('🔥 ChatPage: Message added successfully')
      } else if ((data.type === 'user_joined' || data.type === 'user_left') && currentRoom) {
        console.log('ChatPage: User event, reloading online users')
        loadOnlineUsers(currentRoom.id).catch(() => {})
      } else {
        console.warn('❌ ChatPage: Message not processed:', {
          type: data.type,
          hasCurrentRoom: !!currentRoom,
          hasMessage: !!data.message,
          messageRoomId: data.message?.room_id,
          data,
        })
      }
    },
    [currentRoom, addMessage, loadOnlineUsers]
  )

  // 其他 WebSocket 事件（如离线、在线、消息队列等）可根据需要精简
  const handleOffline = useCallback(() => {}, [])
  const handleOnline = useCallback(() => {}, [])
  const handleMessageQueued = useCallback(() => {}, [])
  const handleMessageSent = useCallback(() => {}, [])
  const handleMessageFailed = useCallback(() => {}, [])

  const handleMessageSentSuccess = useCallback(
    (messageData: ChatMessage) => {
      if (currentRoom) {
        addMessage(currentRoom.id, messageData)
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
    if (isAuthenticated && !authLoading && !hasLoadedInitialDataRef.current) {
      hasLoadedInitialDataRef.current = true
      loadRooms().catch(handleError)
      connect().catch(handleError)
    }
  }, [isAuthenticated, authLoading, connect, loadRooms, handleError])

  // 房间切换时加载在线用户并加入 WebSocket 房间
  useEffect(() => {
    console.log('🔥 ChatPage: Room/connection effect triggered:', {
      currentRoom: currentRoom?.id,
      isAuthenticated,
      connectionStatus: connectionInfo.status,
      wsJoinRoomFunction: !!wsJoinRoom,
    })

    if (currentRoom && isAuthenticated && connectionInfo.status === 'connected') {
      console.log('🔥 ChatPage: Loading online users and joining WebSocket room:', currentRoom.id)
      console.log('🔥 ChatPage: Connection status:', connectionInfo.status)
      console.log('🔥 ChatPage: Is authenticated:', isAuthenticated)
      loadOnlineUsers(currentRoom.id).catch(handleError)
      wsJoinRoom(currentRoom.id.toString())
      console.log('🔥 ChatPage: WebSocket joinRoom called for room:', currentRoom.id)

      // 添加一个简单的测试来验证WebSocket连接
      setTimeout(() => {
        console.log('🔥 ChatPage: Testing WebSocket connection after 2 seconds')
        console.log('🔥 ChatPage: Connection info:', connectionInfo)
        console.log('🔥 ChatPage: Current room:', currentRoom?.id)

        // 强制测试房间加入
        console.log('🔥 ChatPage: Force testing wsJoinRoom for room 31')
        wsJoinRoom('31')
        console.log('🔥 ChatPage: Force wsJoinRoom called')
      }, 2000)
    } else {
      console.log('🔥 ChatPage: Not joining room because:', {
        hasCurrentRoom: !!currentRoom,
        isAuthenticated,
        connectionStatus: connectionInfo.status,
      })

      // 即使没有当前房间，也强制加入房间31进行测试
      if (isAuthenticated && connectionInfo.status === 'connected') {
        console.log('🔥 ChatPage: Force joining room 31 for testing (no current room)')
        wsJoinRoom('31')
        console.log('🔥 ChatPage: Force wsJoinRoom(31) called')
      }
    }
  }, [
    currentRoom,
    isAuthenticated,
    connectionInfo.status,
    loadOnlineUsers,
    wsJoinRoom,
    handleError,
    connectionInfo,
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
    <div className="bg-background flex h-screen flex-col">
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

      {/* Mobile Header */}
      <div className="flex items-center justify-between border-b p-4 lg:hidden">
        <div className="flex items-center gap-3">
          <Sheet open={isRoomListOpen} onOpenChange={setIsRoomListOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <MenuIcon className="h-5 w-5" />
                <span className="sr-only">Open room list</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SheetHeader className="border-b p-4">
                <SheetTitle className="flex items-center gap-2">
                  <MessageSquareIcon className="h-5 w-5" />
                  Chat Rooms
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-hidden">
                <ChatRoomList onRoomSelect={() => setIsRoomListOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex-1">
            {currentRoom ? (
              <div>
                <h1 className="text-lg font-semibold">{currentRoom.name}</h1>
                {currentRoom.description && (
                  <p className="text-muted-foreground text-sm">{currentRoom.description}</p>
                )}
              </div>
            ) : (
              <h1 className="text-lg font-semibold">Chat</h1>
            )}
          </div>
        </div>

        {/* Connection Status - Mobile */}
        <div className="flex items-center gap-2">
          <ConnectionStatusIndicator
            connectionInfo={connectionInfo}
            offlineState={offlineState}
            onReconnect={reconnect}
            onRetryMessages={retryFailedMessages}
            onClearQueue={clearOfflineQueue}
            className="relative"
          />
        </div>

        {currentRoom && (
          <Sheet open={isUsersListOpen} onOpenChange={setIsUsersListOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <UsersIcon className="h-5 w-5" />
                <span className="sr-only">Open users list</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <SheetHeader className="border-b p-4">
                <SheetTitle className="flex items-center gap-2">
                  <UsersIcon className="h-5 w-5" />
                  Online Users
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

      {/* Desktop Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Room List Sidebar - Desktop */}
        <div className="bg-muted/30 hidden w-80 border-r lg:flex lg:flex-col">
          <div className="border-b p-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold">
                <MessageSquareIcon className="h-5 w-5" />
                Chat Rooms
              </h2>
            </div>
            {/* Connection Status - Desktop */}
            <div className="mt-3">
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
        </div>

        {/* Main Chat Area */}
        <div className="flex flex-1 flex-col">
          {currentRoom ? (
            <>
              {/* Chat Header */}
              <ChatHeader room={currentRoom} showBackButton={false} />

              {/* Messages */}
              <div className="flex-1 overflow-hidden">
                <MessageList roomId={currentRoom.id} onReply={handleReply} />
              </div>

              {/* Message Input */}
              <MessageInput
                roomId={currentRoom.id}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
                sendMessage={sendMessage}
                isConnected={connectionInfo.status === 'connected'}
              />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <MessageSquareIcon className="text-muted-foreground/50 mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-medium">Welcome to Chat</h3>
                <p className="text-muted-foreground mt-2">
                  Select a room to start chatting or create a new one
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
              Online Users
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
                  Select a room to see online users
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
    <div className="bg-background flex h-screen flex-col">
      {/* Mobile Header Skeleton */}
      <div className="flex items-center justify-between border-b p-4 lg:hidden">
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
