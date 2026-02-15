import React, { memo } from 'react'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Check, X, LogOut } from 'lucide-react'

interface ProfileViewProps {
  userName: string
  confirmingLogout: boolean
  onGoToDashboard: () => void
  onLogoutStart: () => void
  onLogoutConfirm: () => void
  onLogoutCancel: () => void
}

export const ProfileView = memo<ProfileViewProps>(
  ({
    userName,
    confirmingLogout,
    onGoToDashboard,
    onLogoutStart,
    onLogoutConfirm,
    onLogoutCancel,
  }) => {
    return (
      <div className="flex flex-col gap-6">
        {/* 用户信息 */}
        <div className="flex items-center gap-4">
          <div className="bg-primary text-primary-foreground flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-lg font-medium">{userName}</div>
            <div className="text-muted-foreground text-sm">个人账号</div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={onGoToDashboard}
          >
            <LayoutDashboard className="h-4 w-4" />
            进入仪表盘
          </Button>

          {confirmingLogout ? (
            <div className="flex gap-2">
              <Button variant="default" className="flex-1" onClick={onLogoutConfirm}>
                <Check className="mr-2 h-4 w-4" />
                确认退出
              </Button>
              <Button variant="outline" className="flex-1" onClick={onLogoutCancel}>
                <X className="mr-2 h-4 w-4" />
                取消
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-red-500"
              onClick={onLogoutStart}
            >
              <LogOut className="h-4 w-4" />
              退出登录
            </Button>
          )}
        </div>
      </div>
    )
  }
)

ProfileView.displayName = 'ProfileView'
