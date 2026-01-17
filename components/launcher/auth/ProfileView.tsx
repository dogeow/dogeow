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
      <div className="flex flex-1 items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-base font-medium">{userName}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* 仪表盘按钮 */}
          <Button
            variant="ghost"
            className="text-primary hover:text-primary hover:bg-primary/10 flex items-center gap-2"
            onClick={onGoToDashboard}
          >
            <LayoutDashboard className="h-4 w-4" />
          </Button>

          {confirmingLogout ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
                onClick={onLogoutConfirm}
              >
                <Check className="h-4 w-4" />
                <span>确认</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={onLogoutCancel}>
                <X className="h-4 w-4" />
                <span>取消</span>
              </Button>
            </div>
          ) : (
            <Button variant="ghost" className="flex items-center gap-2" onClick={onLogoutStart}>
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }
)

ProfileView.displayName = 'ProfileView'
