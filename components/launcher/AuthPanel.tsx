'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import useAuthStore from '@/stores/authStore'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { LoginForm } from './auth/LoginForm'
import { ProfileView } from './auth/ProfileView'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

type DisplayMode = 'music' | 'apps' | 'settings'

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
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
        position: 'top-center',
      })
      onOpenChange(false)
    } catch (err) {
      toast.error('登录失败', {
        description: err instanceof Error ? err.message : '登录失败，请检查邮箱和密码',
        position: 'top-center',
      })
    }
  }

  const handleLogoutStart = () => {
    setConfirmingLogout(true)
  }

  const handleLogoutConfirm = () => {
    logout()
    toast.success('已退出登录', {
      position: 'top-center',
    })
    setConfirmingLogout(false)
    onOpenChange(false)
  }

  const handleLogoutCancel = () => {
    setConfirmingLogout(false)
  }

  const handleGoToDashboard = () => {
    router.push('/dashboard')
    onOpenChange(false)
  }

  // 渲染登录视图
  const renderLoginView = () => (
    <LoginForm
      email={email}
      password={password}
      loading={loading}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
    />
  )

  // 渲染个人信息视图
  const renderProfileView = () => (
    <ProfileView
      userName={user?.name || ''}
      confirmingLogout={confirmingLogout}
      onGoToDashboard={handleGoToDashboard}
      onLogoutStart={handleLogoutStart}
      onLogoutConfirm={handleLogoutConfirm}
      onLogoutCancel={handleLogoutCancel}
    />
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-h-[300px] w-[90%] max-w-md overflow-hidden p-0">
        <DialogTitle className="mb-6 text-center text-xl font-semibold">
          {isAuthenticated && user ? '个人资料' : '登录'}
        </DialogTitle>
        <div className="px-6 pb-6">
          {isAuthenticated && user ? renderProfileView() : renderLoginView()}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// 保留旧的 AuthPanel 以保持兼容性
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
        position: 'top-center',
      })
      toggleDisplayMode('apps')
    } catch (err) {
      toast.error('登录失败', {
        description: err instanceof Error ? err.message : '登录失败，请检查邮箱和密码',
        position: 'top-center',
      })
    }
  }

  const handleLogoutStart = () => {
    setConfirmingLogout(true)
  }

  const handleLogoutConfirm = () => {
    logout()
    toast.success('已退出登录', {
      position: 'top-center',
    })
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
        <LoginForm
          email={email}
          password={password}
          loading={loading}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  )

  // 渲染个人信息视图
  const renderProfileView = () => (
    <div className="flex w-full items-center justify-between">
      <Button variant="ghost" className="h-10 w-10 p-0" onClick={() => toggleDisplayMode('apps')}>
        <ChevronLeft className="h-5 w-5" />
      </Button>

      {user && (
        <ProfileView
          userName={user.name}
          confirmingLogout={confirmingLogout}
          onGoToDashboard={handleGoToDashboard}
          onLogoutStart={handleLogoutStart}
          onLogoutConfirm={handleLogoutConfirm}
          onLogoutCancel={handleLogoutCancel}
        />
      )}
    </div>
  )

  // 根据登录状态渲染内容
  if (isAuthenticated && user) {
    return renderProfileView()
  }

  return renderLoginView()
}
