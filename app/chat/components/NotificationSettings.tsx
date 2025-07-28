'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Settings, Bell, Volume2, MessageSquare, AtSign } from 'lucide-react'
import useChatStore from '@/stores/chatStore'
import NotificationService from '@/lib/services/notificationService'

interface NotificationSettingsProps {
  className?: string
}

export default function NotificationSettings({ className }: NotificationSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)

  const {
    notificationSettings,
    browserNotificationPermission,
    updateNotificationSettings,
    requestBrowserNotificationPermission,
  } = useChatStore()

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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={className}>
          <Settings className="h-4 w-4" />
          <span className="sr-only">Notification Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
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
  )
}
