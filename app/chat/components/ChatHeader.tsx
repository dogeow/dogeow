'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  ArrowLeft,
  Settings,
  Users,
  Hash,
  Info,
  Bell,
  Volume2,
  MessageSquare,
  AtSign,
  MenuIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import useChatStore from '@/app/chat/chatStore'
import NotificationService from '@/lib/services/notificationService'
import type { ChatRoom } from '../types'
import { useTranslation } from '@/hooks/useTranslation'

// 聊天头部组件属性接口
interface ChatHeaderProps {
  room: ChatRoom
  onBack?: () => void
  showBackButton?: boolean
  searchQuery?: string
  onSearchChange?: (query: string) => void
  onOpenRoomList?: () => void
  onOpenUsersList?: () => void
}

export function ChatHeader({
  room,
  onBack,
  showBackButton = false,
  onOpenRoomList,
  onOpenUsersList,
}: ChatHeaderProps) {
  // 从聊天状态管理获取数据
  const {
    onlineUsers,
    connectionStatus,
    isConnected,
    notificationSettings,
    browserNotificationPermission,
    updateNotificationSettings,
    requestBrowserNotificationPermission,
  } = useChatStore()
  const { t } = useTranslation()

  // 对话框状态管理
  const [isRoomInfoOpen, setIsRoomInfoOpen] = useState(false)
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false)
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)

  // 获取当前房间的在线用户信息
  const roomOnlineUsers = useMemo(
    () => onlineUsers[room.id.toString()] || [],
    [onlineUsers, room.id]
  )
  const onlineCount = useMemo(() => {
    const storeCount = roomOnlineUsers.length
    const roomCount = room.online_count ?? 0
    const connectedSelf = isConnected ? 1 : 0
    return Math.max(storeCount, roomCount, connectedSelf)
  }, [roomOnlineUsers.length, room.online_count, isConnected])

  // 获取通知服务实例
  const notificationService = useMemo(() => NotificationService.getInstance(), [])

  // 请求浏览器通知权限
  const handleRequestPermission = useCallback(async () => {
    setIsRequestingPermission(true)
    try {
      await requestBrowserNotificationPermission()
    } catch (error) {
      console.error('请求通知权限失败:', error)
    } finally {
      setIsRequestingPermission(false)
    }
  }, [requestBrowserNotificationPermission])

  // 测试通知功能
  const handleTestNotification = useCallback(() => {
    notificationService.showNotification({
      title: '测试通知',
      body: '这是来自聊天系统的测试通知。',
      tag: 'test-notification',
    })
  }, [notificationService])

  // 测试声音效果
  const handleTestSound = useCallback(
    (soundName: string) => {
      notificationService.playSound(soundName)
    },
    [notificationService]
  )

  // 获取权限状态信息
  const permissionStatus = useMemo(() => {
    switch (browserNotificationPermission) {
      case 'granted':
        return { text: '已授权', color: 'text-green-600' }
      case 'denied':
        return { text: '已拒绝', color: 'text-red-600' }
      default:
        return { text: '未请求', color: 'text-yellow-600' }
    }
  }, [browserNotificationPermission])

  return (
    <>
      {/* 桌面端头部 */}
      <div className="bg-background hidden items-center justify-between border-b p-4 md:flex">
        {/* 左侧 - 导航和房间信息 */}
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">{t('chat.go_back', '返回')}</span>
            </Button>
          )}
        </div>

        {/* 中间 - 房间详情 */}
        <div className="flex flex-1 justify-center">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3">
              <Hash className="text-muted-foreground h-4 w-4" />
              <h1 className="font-semibold">{room.name}</h1>
              {room.description && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => setIsRoomInfoOpen(true)}
                >
                  <Info className="h-3 w-3" />
                </Button>
              )}
              <div className="flex items-center gap-1 text-xs">
                <div
                  className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                />
                <span className="text-muted-foreground">
                  {connectionStatus === 'connected'
                    ? t('chat.connected', '已连接')
                    : t('chat.disconnected', '已断开')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧 - 操作按钮 */}
        <div className="flex items-center gap-2">
          {/* 在线用户数量 */}
          <div className="flex items-center gap-1">
            <Users className="text-muted-foreground h-4 w-4" />
            <Badge variant="secondary" className="text-xs">
              {onlineCount}
            </Badge>
          </div>

          {/* 设置下拉菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
                <span className="sr-only">{t('settings.title', '设置')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{t('page.chat_settings', '聊天设置')}</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* 通知设置 */}
              <DropdownMenuItem
                onClick={() => setIsNotificationSettingsOpen(true)}
                className="min-h-11 gap-2 px-3 py-2 md:min-h-9 md:px-2 md:py-1.5"
              >
                <Bell className="mr-2 h-4 w-4" />
                {t('chat.notification_settings', '通知设置')}
              </DropdownMenuItem>

              {/* 房间信息 */}
              <DropdownMenuItem
                onClick={() => setIsRoomInfoOpen(true)}
                className="min-h-11 gap-2 px-3 py-2 md:min-h-9 md:px-2 md:py-1.5"
              >
                <Info className="mr-2 h-4 w-4" />
                {t('chat.room_info', '房间信息')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 移动端头部 - 合并导航和房间信息 */}
      <div className="bg-background flex items-center justify-between border-b p-4 md:hidden">
        {/* 左侧 - 导航和房间信息 */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {/* 菜单按钮 */}
          {onOpenRoomList && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                console.log('Menu button clicked')
                onOpenRoomList()
              }}
              className="shrink-0"
            >
              <MenuIcon className="h-4 w-4" />
              <span className="sr-only">{t('chat.open_room_list', 'Open room list')}</span>
            </Button>
          )}

          {/* 返回按钮 */}
          {showBackButton && (
            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">{t('chat.go_back', '返回')}</span>
            </Button>
          )}

          {/* 房间信息 */}
          <div className="flex min-w-0 items-center gap-1">
            <Hash className="text-muted-foreground h-4 w-4 shrink-0" />
            <div className="flex min-w-0 items-center gap-1">
              <h1 className="truncate font-semibold">{room.name}</h1>
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  isConnected
                    ? 'bg-green-500'
                    : connectionStatus === 'connecting'
                      ? 'animate-pulse bg-yellow-500'
                      : 'bg-red-500'
                }`}
                title={
                  isConnected
                    ? `已连接 (${connectionStatus})`
                    : connectionStatus === 'connecting'
                      ? `连接中... (${connectionStatus})`
                      : `连接断开 (${connectionStatus})`
                }
                onClick={() => {
                  if (process.env.NODE_ENV === 'development') {
                    console.log('🔍 连接状态详情:', {
                      isConnected,
                      connectionStatus,
                      timestamp: new Date().toLocaleTimeString(),
                    })
                  }
                }}
              />
            </div>
            {room.description && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 shrink-0"
                onClick={() => setIsRoomInfoOpen(true)}
              >
                <Info className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* 右侧 - 操作按钮 */}
        <div className="flex shrink-0 items-center gap-1">
          {/* 合并的用户列表按钮 - 包含在线用户数量和状态 */}
          {onOpenUsersList && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                console.log('Users list button clicked')
                onOpenUsersList()
              }}
              className="relative"
            >
              <Users className="h-4 w-4" />
              {/* 在线用户数量徽章 */}
              <Badge
                variant="secondary"
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
              >
                {onlineCount}
              </Badge>
              <span className="sr-only">{t('chat.open_users_list', 'Open users list')}</span>
            </Button>
          )}

          {/* 设置下拉菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
                <span className="sr-only">{t('settings.title', '设置')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{t('page.chat_settings', '聊天设置')}</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* 通知设置 */}
              <DropdownMenuItem
                onClick={() => setIsNotificationSettingsOpen(true)}
                className="min-h-11 gap-2 px-3 py-2 md:min-h-9 md:px-2 md:py-1.5"
              >
                <Bell className="mr-2 h-4 w-4" />
                {t('chat.notification_settings', '通知设置')}
              </DropdownMenuItem>

              {/* 房间信息 */}
              <DropdownMenuItem
                onClick={() => setIsRoomInfoOpen(true)}
                className="min-h-11 gap-2 px-3 py-2 md:min-h-9 md:px-2 md:py-1.5"
              >
                <Info className="mr-2 h-4 w-4" />
                {t('chat.room_info', '房间信息')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 房间信息对话框 */}
      <Dialog open={isRoomInfoOpen} onOpenChange={setIsRoomInfoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              {room.name}
            </DialogTitle>
            {room.description && <DialogDescription>{room.description}</DialogDescription>}
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{onlineCount}</div>
                <div className="text-muted-foreground text-sm">
                  {t('chat.room_info.online_users', '在线用户')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {new Date(room.created_at).toLocaleDateString()}
                </div>
                <div className="text-muted-foreground text-sm">
                  {t('chat.room_info.created', '创建时间')}
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="mb-2 font-medium">{t('chat.room_info.online_users', '在线用户')}</h4>
              <div className="max-h-32 overflow-y-auto">
                {roomOnlineUsers.length > 0 ? (
                  <div className="space-y-1">
                    {roomOnlineUsers.map(user => (
                      <div key={user.id} className="flex items-center gap-2 text-sm">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span>{user.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {t('chat.room_info.no_users_online', '当前没有用户在线')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 通知设置对话框 */}
      <Dialog open={isNotificationSettingsOpen} onOpenChange={setIsNotificationSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('chat.notification_settings', '通知设置')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* 浏览器权限状态 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">浏览器权限</CardTitle>
                <CardDescription>
                  状态: <span className={permissionStatus.color}>{permissionStatus.text}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {browserNotificationPermission !== 'granted' && (
                  <Button
                    onClick={handleRequestPermission}
                    disabled={isRequestingPermission || browserNotificationPermission === 'denied'}
                    size="sm"
                    className="w-full"
                  >
                    {isRequestingPermission ? '请求中...' : '请求权限'}
                  </Button>
                )}

                {browserNotificationPermission === 'granted' && (
                  <div className="space-y-2">
                    <Button
                      onClick={handleTestNotification}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      测试通知
                    </Button>
                  </div>
                )}

                {browserNotificationPermission === 'denied' && (
                  <p className="text-muted-foreground text-xs">
                    通知已被阻止。请在浏览器设置中启用通知。
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 通知偏好设置 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">通知偏好设置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 浏览器通知 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <Label htmlFor="browser-notifications" className="text-sm">
                      浏览器通知
                    </Label>
                  </div>
                  <Switch
                    id="browser-notifications"
                    checked={notificationSettings.browserNotifications}
                    onCheckedChange={checked =>
                      updateNotificationSettings({ browserNotifications: checked })
                    }
                    disabled={browserNotificationPermission !== 'granted'}
                  />
                </div>

                {/* 声音通知 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    <Label htmlFor="sound-notifications" className="text-sm">
                      声音效果
                    </Label>
                  </div>
                  <Switch
                    id="sound-notifications"
                    checked={notificationSettings.soundNotifications}
                    onCheckedChange={checked =>
                      updateNotificationSettings({ soundNotifications: checked })
                    }
                  />
                </div>

                {/* 房间通知 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <Label htmlFor="room-notifications" className="text-sm">
                      新消息
                    </Label>
                  </div>
                  <Switch
                    id="room-notifications"
                    checked={notificationSettings.roomNotifications}
                    onCheckedChange={checked =>
                      updateNotificationSettings({ roomNotifications: checked })
                    }
                  />
                </div>

                {/* 提及通知 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AtSign className="h-4 w-4" />
                    <Label htmlFor="mention-notifications" className="text-sm">
                      提及
                    </Label>
                  </div>
                  <Switch
                    id="mention-notifications"
                    checked={notificationSettings.mentionNotifications}
                    onCheckedChange={checked =>
                      updateNotificationSettings({ mentionNotifications: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* 声音测试 */}
            {notificationSettings.soundNotifications && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">测试声音</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => handleTestSound('message')} variant="outline" size="sm">
                      消息
                    </Button>
                    <Button onClick={() => handleTestSound('mention')} variant="outline" size="sm">
                      提及
                    </Button>
                    <Button onClick={() => handleTestSound('join')} variant="outline" size="sm">
                      加入
                    </Button>
                    <Button onClick={() => handleTestSound('leave')} variant="outline" size="sm">
                      离开
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
