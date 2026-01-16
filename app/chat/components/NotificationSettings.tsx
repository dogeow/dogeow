'use client'

import { useState, useCallback, useMemo } from 'react'
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
import useChatStore from '@/app/chat/chatStore'
import NotificationService from '@/lib/services/notificationService'

interface NotificationSettingsProps {
  className?: string
}

// 获取权限状态显示内容
const getPermissionStatus = (permission: string) => {
  switch (permission) {
    case 'granted':
      return { text: 'Granted', color: 'text-green-600' }
    case 'denied':
      return { text: 'Denied', color: 'text-red-600' }
    default:
      return { text: 'Not requested', color: 'text-yellow-600' }
  }
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

  const notificationService = useMemo(() => NotificationService.getInstance(), [])

  // 请求浏览器通知权限
  const handleRequestPermission = useCallback(async () => {
    setIsRequestingPermission(true)
    try {
      await requestBrowserNotificationPermission()
    } catch (error) {
      // 保留原有注释
      console.error('Failed to request notification permission:', error)
    } finally {
      setIsRequestingPermission(false)
    }
  }, [requestBrowserNotificationPermission])

  // 通知测试
  const handleTestNotification = useCallback(() => {
    notificationService.showNotification({
      title: 'Test Notification',
      body: 'This is a test notification from the chat system.',
      tag: 'test-notification',
    })
  }, [notificationService])

  // 声音测试
  const handleTestSound = useCallback(
    (soundName: string) => {
      notificationService.playSound(soundName)
    },
    [notificationService]
  )

  // 优化为 useMemo，防止不必要的 render
  const permissionStatus = useMemo(
    () => getPermissionStatus(browserNotificationPermission),
    [browserNotificationPermission]
  )

  // 渲染权限按钮及状态
  const renderPermissionSection = () => (
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
            <Button onClick={handleTestNotification} variant="outline" size="sm" className="w-full">
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
  )

  // 通用的开关渲染
  interface SwitchConfig {
    id: string
    checked: boolean
    onCheckedChange: (checked: boolean) => void
    icon: React.ReactNode
    label: string
    disabled?: boolean
  }

  const switches: SwitchConfig[] = [
    {
      id: 'browser-notifications',
      checked: notificationSettings.browserNotifications,
      onCheckedChange: checked => updateNotificationSettings({ browserNotifications: checked }),
      icon: <Bell className="h-4 w-4" />,
      label: 'Browser Notifications',
      disabled: browserNotificationPermission !== 'granted',
    },
    {
      id: 'sound-notifications',
      checked: notificationSettings.soundNotifications,
      onCheckedChange: checked => updateNotificationSettings({ soundNotifications: checked }),
      icon: <Volume2 className="h-4 w-4" />,
      label: 'Sound Effects',
    },
    {
      id: 'room-notifications',
      checked: notificationSettings.roomNotifications,
      onCheckedChange: checked => updateNotificationSettings({ roomNotifications: checked }),
      icon: <MessageSquare className="h-4 w-4" />,
      label: 'New Messages',
    },
    {
      id: 'mention-notifications',
      checked: notificationSettings.mentionNotifications,
      onCheckedChange: checked => updateNotificationSettings({ mentionNotifications: checked }),
      icon: <AtSign className="h-4 w-4" />,
      label: 'Mentions',
    },
  ]

  // 渲染通知偏好
  const renderPreferencesSection = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {switches.map(({ id, checked, onCheckedChange, icon, label, disabled }) => (
          <div className="flex items-center justify-between" key={id}>
            <div className="flex items-center gap-2">
              {icon}
              <Label htmlFor={id} className="text-sm">
                {label}
              </Label>
            </div>
            <Switch
              id={id}
              checked={checked}
              onCheckedChange={onCheckedChange}
              disabled={disabled}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )

  // 渲染声音测试按钮
  const soundTestButtons = [
    { name: 'message', label: 'Message' },
    { name: 'mention', label: 'Mention' },
    { name: 'join', label: 'Join' },
    { name: 'leave', label: 'Leave' },
  ]

  const renderSoundTest = () =>
    notificationSettings.soundNotifications && (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Test Sounds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {soundTestButtons.map(btn => (
              <Button
                key={btn.name}
                onClick={() => handleTestSound(btn.name)}
                variant="outline"
                size="sm"
              >
                {btn.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={className}>
          <Settings className="h-4 w-4" />
          {/* 设置 - 保留无障碍描述 */}
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
          {renderPermissionSection()}

          {/* Notification Preferences */}
          {renderPreferencesSection()}

          {/* Sound Test */}
          {renderSoundTest()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
