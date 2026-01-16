'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import useAuthStore from '@/stores/authStore'
import { useRouter } from 'next/navigation'
import { ChevronLeft, LayoutDashboard, Check, X, LogOut } from 'lucide-react'

type DisplayMode = 'music' | 'apps' | 'settings'

export interface AuthPanelProps {
  toggleDisplayMode: (mode: DisplayMode) => void
}

export function AuthPanel({ toggleDisplayMode }: AuthPanelProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const { login, loading, isAuthenticated, user, logout } = useAuthStore()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await login(email, password)
      toast.success('登录成功', {
        description: `欢迎回来，${email}`,
      })
      toggleDisplayMode('apps')
    } catch (err) {
      toast.error('登录失败', {
        description: err instanceof Error ? err.message : '登录失败，请检查邮箱和密码',
      })
    }
  }

  const handleLogoutStart = () => {
    setConfirmingLogout(true)
  }

  const handleLogoutConfirm = () => {
    logout()
    toast.success('已退出登录')
    setConfirmingLogout(false)
    toggleDisplayMode('apps')
  }

  const handleLogoutCancel = () => {
    setConfirmingLogout(false)
  }

  const handleGoToDashboard = () => {
    router.push('/dashboard')
    toggleDisplayMode('apps')
  }

  // 渲染登录视图 - 简洁一行式
  const renderLoginView = () => (
    <div className="flex w-full items-center justify-between">
      <Button variant="ghost" className="h-10 w-10 p-0" onClick={() => toggleDisplayMode('apps')}>
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <div className="flex flex-1 items-center gap-2">
        <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="邮箱"
            className="h-8"
            required
          />
          <Input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="密码"
            className="h-8"
            required
          />
          <Button type="submit" className="h-8" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </Button>
        </form>
      </div>
    </div>
  )

  // 渲染个人信息视图
  const renderProfileView = () => (
    <div className="flex w-full items-center justify-between">
      <Button variant="ghost" className="h-10 w-10 p-0" onClick={() => toggleDisplayMode('apps')}>
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <div className="flex flex-1 items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-base font-medium">{user?.name}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* 仪表盘按钮 */}
          <Button
            variant="ghost"
            className="text-primary hover:text-primary hover:bg-primary/10 flex items-center gap-2"
            onClick={handleGoToDashboard}
          >
            <LayoutDashboard className="h-4 w-4" />
          </Button>

          {confirmingLogout ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
                onClick={handleLogoutConfirm}
              >
                <Check className="h-4 w-4" />
                <span>确认</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogoutCancel}>
                <X className="h-4 w-4" />
                <span>取消</span>
              </Button>
            </div>
          ) : (
            <Button variant="ghost" className="flex items-center gap-2" onClick={handleLogoutStart}>
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )

  // 根据登录状态渲染内容
  if (isAuthenticated && user) {
    return renderProfileView()
  }

  return renderLoginView()
}
