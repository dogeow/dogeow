import React, { memo, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { User, LayoutDashboard, LogOut, Check, X } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/stores/authStore'
import { toast } from 'sonner'

interface UserButtonProps {
  isAuthenticated: boolean
  onToggleAuth: () => void
}

export const UserButton = memo<UserButtonProps>(({ isAuthenticated, onToggleAuth }) => {
  const { t } = useTranslation()
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
        setConfirmingLogout(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleGoToDashboard = () => {
    setOpen(false)
    setConfirmingLogout(false)
    router.push('/dashboard')
  }

  const handleLogoutConfirm = async () => {
    try {
      await logout()
      toast.success('已退出登录', {
        position: 'top-center',
      })
      setOpen(false)
      setConfirmingLogout(false)
    } catch {
      toast.error('退出登录失败，请稍后重试', {
        position: 'top-center',
      })
    }
  }

  if (isAuthenticated) {
    return (
      <div className="relative" ref={ref}>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setOpen(prev => !prev)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="用户菜单"
        >
          <User className="h-5 w-5" />
        </Button>

        {open && (
          <div className="bg-background border-border absolute right-0 top-full z-[100] mt-2 w-72 rounded-lg border p-4 shadow-lg">
            <div className="mb-4 flex items-center gap-3">
              <div className="bg-primary text-primary-foreground flex h-11 w-11 items-center justify-center rounded-full text-base font-semibold">
                {(user?.name ?? 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user?.name || 'User'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                className="h-9 w-full justify-start gap-2"
                onClick={handleGoToDashboard}
              >
                <LayoutDashboard className="h-4 w-4" />
                进入仪表盘
              </Button>

              <Button
                variant="outline"
                className="h-9 w-full justify-start gap-2 text-red-500"
                onClick={() => setConfirmingLogout(true)}
              >
                <LogOut className="h-4 w-4" />
                退出登录
              </Button>
              {confirmingLogout && (
                <div className="grid grid-cols-2 gap-2">
                  <Button className="h-9" onClick={handleLogoutConfirm}>
                    <Check className="mr-1 h-4 w-4" />
                    确认
                  </Button>
                  <Button
                    variant="outline"
                    className="h-9"
                    onClick={() => setConfirmingLogout(false)}
                  >
                    <X className="mr-1 h-4 w-4" />
                    取消
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Button variant="default" className="h-8" data-login-trigger onClick={onToggleAuth}>
      {t('auth.login')}
    </Button>
  )
})

UserButton.displayName = 'UserButton'
