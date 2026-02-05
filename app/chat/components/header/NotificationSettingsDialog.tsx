import React, { memo, useMemo, useCallback, useState } from 'react'
import { Bell, Volume2, MessageSquare, AtSign } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from '@/hooks/useTranslation'
import { toast } from 'sonner'
import { useNotificationService } from '@/app/chat/hooks/useNotificationService'

interface NotificationSettings {
  browserNotifications: boolean
  soundNotifications: boolean
  mentionNotifications: boolean
  roomNotifications: boolean
}

interface NotificationSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  notificationSettings: NotificationSettings
  browserNotificationPermission: NotificationPermission
  onUpdateNotificationSettings: (settings: Partial<NotificationSettings>) => void
  onRequestBrowserNotificationPermission: () => Promise<NotificationPermission>
}

export const NotificationSettingsDialog = memo<NotificationSettingsDialogProps>(
  ({
    open,
    onOpenChange,
    notificationSettings,
    browserNotificationPermission,
    onUpdateNotificationSettings,
    onRequestBrowserNotificationPermission,
  }) => {
    const { t } = useTranslation()
    const { getNotificationService } = useNotificationService()
    const [isRequestingPermission, setIsRequestingPermission] = useState(false)
    const [testNotificationStatus, setTestNotificationStatus] = useState<string | null>(null)

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

    const handleRequestPermission = useCallback(async () => {
      setIsRequestingPermission(true)
      try {
        await onRequestBrowserNotificationPermission()
      } catch (error) {
        console.error('请求通知权限失败:', error)
      } finally {
        setIsRequestingPermission(false)
      }
    }, [onRequestBrowserNotificationPermission])

    const handleTestNotification = useCallback(() => {
      const notificationService = getNotificationService()
      setTestNotificationStatus(null)

      if (!notificationService.isNotificationSupported()) {
        const message = '浏览器未授权通知或不支持通知'
        toast.error(message)
        setTestNotificationStatus(message)
        return
      }

      const notification = notificationService.showNotification({
        title: '测试通知',
        body: '这是来自聊天系统的测试通知。',
        tag: 'test-notification',
        requireInteraction: true,
      })

      if (!notification) {
        const message = '通知未显示，可能被系统勿扰模式或浏览器设置阻止'
        toast.error(message)
        setTestNotificationStatus(message)
        return
      }

      const successMessage = '已发送测试通知，请查看系统通知中心'
      toast.success(successMessage)
      setTestNotificationStatus(successMessage)
    }, [getNotificationService])

    const handleTestSound = useCallback(
      (soundName: string) => {
        getNotificationService().playSound(soundName)
      },
      [getNotificationService]
    )

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
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
                    {testNotificationStatus && (
                      <p className="text-muted-foreground text-xs">{testNotificationStatus}</p>
                    )}
                  </div>
                )}

                {browserNotificationPermission === 'denied' && (
                  <p className="text-muted-foreground text-xs">
                    通知已被阻止。请在浏览器设置中启用通知。
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 通知偏好设置 - 频道层 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">通知偏好设置</CardTitle>
                <CardDescription>选择接收哪些类型的消息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                      onUpdateNotificationSettings({ roomNotifications: checked })
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
                      onUpdateNotificationSettings({ mentionNotifications: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* 通知方式设置 - 设备层 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">通知方式设置</CardTitle>
                <CardDescription>控制通知的呈现方式</CardDescription>
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
                      onUpdateNotificationSettings({ browserNotifications: checked })
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
                      onUpdateNotificationSettings({ soundNotifications: checked })
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
    )
  }
)

NotificationSettingsDialog.displayName = 'NotificationSettingsDialog'
