'use client'

import { useState } from 'react'
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

interface ChatHeaderProps {
  room: ChatRoom
  onBack?: () => void
  showBackButton?: boolean
}

export function ChatHeader({ room, onBack, showBackButton = false }: ChatHeaderProps) {
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

  const [isRoomInfoOpen, setIsRoomInfoOpen] = useState(false)
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false)
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)

  const roomOnlineUsers = onlineUsers[room.id.toString()] || []
  const onlineCount = roomOnlineUsers.length

  const notificationService = NotificationService.getInstance()

  const handleRequestPermission = async () => {
    setIsRequestingPermission(true)
    try {
      await requestBrowserNotificationPermission()
    } catch (error) {
      console.error('Failed to request notification permission:', error)
    } finally {
      setIsRequestingPermission(false)
    }
  }

  const handleTestNotification = () => {
    notificationService.showNotification({
      title: 'Test Notification',
      body: 'This is a test notification from the chat system.',
      tag: 'test-notification',
    })
  }

  const handleTestSound = (soundName: string) => {
    notificationService.playSound(soundName)
  }

  const getPermissionStatus = () => {
    switch (browserNotificationPermission) {
      case 'granted':
        return { text: 'Granted', color: 'text-green-600' }
      case 'denied':
        return { text: 'Denied', color: 'text-red-600' }
      default:
        return { text: 'Not requested', color: 'text-yellow-600' }
    }
  }

  const permissionStatus = getPermissionStatus()

  return (
    <>
      <div className="bg-background flex items-center justify-between border-b p-4">
        {/* Left side - Navigation and Room Info */}
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">{t('chat.go_back', 'Go back')}</span>
            </Button>
          )}
        </div>

        {/* Center - Room Details */}
        <div className="hidden md:flex md:flex-1 md:justify-center">
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
                    ? t('chat.connected', 'Connected')
                    : t('chat.disconnected', 'Disconnected')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Online Users Count - Moved to outside */}
          <div className="flex items-center gap-1">
            <Users className="text-muted-foreground h-4 w-4" />
            <Badge variant="secondary" className="text-xs">
              {onlineCount}
            </Badge>
          </div>

          {/* Connection Status (Mobile) */}
          <div
            className={`h-2 w-2 rounded-full md:hidden ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />

          {/* Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
                <span className="sr-only">{t('settings.title', 'Settings')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{t('page.chat_settings', 'Chat Settings')}</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Notification Settings */}
              <DropdownMenuItem onClick={() => setIsNotificationSettingsOpen(true)}>
                <Bell className="mr-2 h-4 w-4" />
                {t('chat.notification_settings', 'Notification Settings')}
              </DropdownMenuItem>

              {/* Room Info */}
              <DropdownMenuItem onClick={() => setIsRoomInfoOpen(true)}>
                <Info className="mr-2 h-4 w-4" />
                {t('chat.room_info', 'Room Info')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Room Info Dialog */}
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
                  {t('chat.room_info.online_users', 'Online Users')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {new Date(room.created_at).toLocaleDateString()}
                </div>
                <div className="text-muted-foreground text-sm">
                  {t('chat.room_info.created', 'Created')}
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="mb-2 font-medium">
                {t('chat.room_info.online_users', 'Online Users')}
              </h4>
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
                    {t('chat.room_info.no_users_online', 'No users currently online')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification Settings Dialog */}
      <Dialog open={isNotificationSettingsOpen} onOpenChange={setIsNotificationSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('chat.notification_settings', 'Notification Settings')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Browser Permission Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Browser Permissions</CardTitle>
                <CardDescription>
                  Status: <span className={permissionStatus.color}>{permissionStatus.text}</span>
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
                    {isRequestingPermission ? 'Requesting...' : 'Request Permission'}
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
                      Test Notification
                    </Button>
                  </div>
                )}

                {browserNotificationPermission === 'denied' && (
                  <p className="text-muted-foreground text-xs">
                    Notifications are blocked. Please enable them in your browser settings.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Browser Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <Label htmlFor="browser-notifications" className="text-sm">
                      Browser Notifications
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

                {/* Sound Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    <Label htmlFor="sound-notifications" className="text-sm">
                      Sound Effects
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

                {/* Room Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <Label htmlFor="room-notifications" className="text-sm">
                      New Messages
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

                {/* Mention Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AtSign className="h-4 w-4" />
                    <Label htmlFor="mention-notifications" className="text-sm">
                      Mentions
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

            {/* Sound Test */}
            {notificationSettings.soundNotifications && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Test Sounds</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => handleTestSound('message')} variant="outline" size="sm">
                      Message
                    </Button>
                    <Button onClick={() => handleTestSound('mention')} variant="outline" size="sm">
                      Mention
                    </Button>
                    <Button onClick={() => handleTestSound('join')} variant="outline" size="sm">
                      Join
                    </Button>
                    <Button onClick={() => handleTestSound('leave')} variant="outline" size="sm">
                      Leave
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
