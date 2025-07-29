'use client'

import { useState } from 'react'
import {
  ArrowLeft,
  Settings,
  HelpCircle,
  Users,
  Hash,
  ChevronRight,
  Volume2,
  VolumeX,
  Bell,
  Palette,
  Info,
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
  DropdownMenuCheckboxItem,
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
import { Separator } from '@/components/ui/separator'
import useChatStore from '@/stores/chatStore'
import { NotificationHistory } from './NotificationHistory'
import { NotificationIndicator } from './NotificationBadge'
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
    notificationSettings,
    updateNotificationSettings,
    connectionStatus,
    isConnected,
  } = useChatStore()
  const { t } = useTranslation()

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isRoomInfoOpen, setIsRoomInfoOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  const roomOnlineUsers = onlineUsers[room.id.toString()] || []
  const onlineCount = roomOnlineUsers.length

  const handleSettingsChange = (key: keyof typeof notificationSettings, value: boolean) => {
    updateNotificationSettings({ [key]: value })
  }

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

          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-1 text-sm">
            <span className="text-muted-foreground">Chat</span>
            <ChevronRight className="text-muted-foreground h-3 w-3" />
            <span className="font-medium">{t('chat.rooms', 'Rooms')}</span>
            <ChevronRight className="text-muted-foreground h-3 w-3" />
            <button
              onClick={() => setIsRoomInfoOpen(true)}
              className="hover:text-foreground text-muted-foreground flex items-center gap-1 transition-colors"
            >
              <Hash className="h-3 w-3" />
              <span className="font-medium">{room.name}</span>
            </button>
          </nav>
        </div>

        {/* Center - Room Details */}
        <div className="hidden md:flex md:flex-1 md:justify-center">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
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
            </div>
            <div className="mt-1 flex items-center justify-center gap-4">
              <div className="text-muted-foreground flex items-center gap-1 text-xs">
                <Users className="h-3 w-3" />
                <span>{onlineCount} online</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div
                  className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                />
                <span className="text-muted-foreground">
                  {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Online Users Count (Mobile) */}
          <div className="flex items-center gap-1 md:hidden">
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

          {/* Notifications Button */}
          <NotificationIndicator count={3} hasMentions={true}>
            <Button variant="ghost" size="icon" onClick={() => setIsNotificationsOpen(true)}>
              <Bell className="h-4 w-4" />
              <span className="sr-only">Notifications</span>
            </Button>
          </NotificationIndicator>

          {/* Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{t('page.chat_settings', 'Chat Settings')}</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuCheckboxItem
                checked={notificationSettings.browserNotifications}
                onCheckedChange={checked => handleSettingsChange('browserNotifications', checked)}
              >
                <Bell className="mr-2 h-4 w-4" />
                {t('chat.browser_notifications', 'Browser Notifications')}
              </DropdownMenuCheckboxItem>

              <DropdownMenuCheckboxItem
                checked={notificationSettings.soundNotifications}
                onCheckedChange={checked => handleSettingsChange('soundNotifications', checked)}
              >
                {notificationSettings.soundNotifications ? (
                  <Volume2 className="mr-2 h-4 w-4" />
                ) : (
                  <VolumeX className="mr-2 h-4 w-4" />
                )}
                {t('chat.sound_notifications', 'Sound Notifications')}
              </DropdownMenuCheckboxItem>

              <DropdownMenuCheckboxItem
                checked={notificationSettings.mentionNotifications}
                onCheckedChange={checked => handleSettingsChange('mentionNotifications', checked)}
              >
                <span className="mr-2 text-sm">@</span>
                {t('chat.mention_notifications', 'Mention Notifications')}
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                <Palette className="mr-2 h-4 w-4" />
                {t('chat.more_settings', 'More Settings')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Help Button */}
          <Button variant="ghost" size="icon" onClick={() => setIsHelpOpen(true)}>
            <HelpCircle className="h-4 w-4" />
            <span className="sr-only">Help</span>
          </Button>
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
                <div className="text-muted-foreground text-sm">Online Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {new Date(room.created_at).toLocaleDateString()}
                </div>
                <div className="text-muted-foreground text-sm">Created</div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="mb-2 font-medium">Online Users</h4>
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
                  <p className="text-muted-foreground text-sm">No users currently online</p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chat Preferences</DialogTitle>
            <DialogDescription>
              Customize your chat experience and notification settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium">Notifications</h4>

              <div className="flex items-center justify-between">
                <Label htmlFor="browser-notifications" className="flex flex-col gap-1">
                  <span>Browser Notifications</span>
                  <span className="text-muted-foreground text-xs">
                    Show notifications when the tab is not active
                  </span>
                </Label>
                <Switch
                  id="browser-notifications"
                  checked={notificationSettings.browserNotifications}
                  onCheckedChange={checked => handleSettingsChange('browserNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="sound-notifications" className="flex flex-col gap-1">
                  <span>Sound Notifications</span>
                  <span className="text-muted-foreground text-xs">Play sound for new messages</span>
                </Label>
                <Switch
                  id="sound-notifications"
                  checked={notificationSettings.soundNotifications}
                  onCheckedChange={checked => handleSettingsChange('soundNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="mention-notifications" className="flex flex-col gap-1">
                  <span>Mention Notifications</span>
                  <span className="text-muted-foreground text-xs">
                    Get notified when someone mentions you
                  </span>
                </Label>
                <Switch
                  id="mention-notifications"
                  checked={notificationSettings.mentionNotifications}
                  onCheckedChange={checked => handleSettingsChange('mentionNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="room-notifications" className="flex flex-col gap-1">
                  <span>Room Notifications</span>
                  <span className="text-muted-foreground text-xs">
                    Get notified for all messages in rooms
                  </span>
                </Label>
                <Switch
                  id="room-notifications"
                  checked={notificationSettings.roomNotifications}
                  onCheckedChange={checked => handleSettingsChange('roomNotifications', checked)}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Chat Help & Documentation</DialogTitle>
            <DialogDescription>Learn how to use the chat features effectively.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <h4 className="mb-3 font-medium">Getting Started</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>Select a room from the sidebar to join the conversation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>Type your message and press Enter to send</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>Use @ followed by a username to mention someone</span>
                </li>
              </ul>
            </div>

            <Separator />

            <div>
              <h4 className="mb-3 font-medium">Keyboard Shortcuts</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Send message</span>
                  <kbd className="bg-muted rounded px-2 py-1 text-xs">Enter</kbd>
                </div>
                <div className="flex justify-between">
                  <span>New line</span>
                  <kbd className="bg-muted rounded px-2 py-1 text-xs">Shift + Enter</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Focus message input</span>
                  <kbd className="bg-muted rounded px-2 py-1 text-xs">Ctrl + /</kbd>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="mb-3 font-medium">Features</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>Real-time messaging with WebSocket connection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>See who&apos;s online in each room</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>Message history with infinite scroll</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>Desktop and mobile notifications</span>
                </li>
              </ul>
            </div>

            <Separator />

            <div className="text-center">
              <p className="text-muted-foreground text-sm">
                Need more help? Contact support or check our documentation.
              </p>
              <div className="mt-2 flex justify-center gap-2">
                <Button variant="outline" size="sm">
                  Contact Support
                </Button>
                <Button variant="outline" size="sm">
                  View Docs
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
        <DialogContent className="p-0 sm:max-h-[80vh] sm:max-w-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Notifications</DialogTitle>
          </DialogHeader>
          <NotificationHistory />
        </DialogContent>
      </Dialog>
    </>
  )
}
