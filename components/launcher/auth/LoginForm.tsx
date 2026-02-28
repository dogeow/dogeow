'use client'

import React, { memo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import useAuthStore from '@/stores/authStore'
import { Github } from 'lucide-react'

interface LoginFormProps {
  email: string
  password: string
  loading: boolean
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
}

export const LoginForm = memo<LoginFormProps>(
  ({ email, password, loading, onEmailChange, onPasswordChange, onSubmit }) => {
    const [isRegister, setIsRegister] = useState(false)
    const [name, setName] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [localLoading, setLocalLoading] = useState(false)
    const [githubLoading, setGithubLoading] = useState(false)
    const { register, loginWithGithub } = useAuthStore()

    const handleGithubLogin = async () => {
      setGithubLoading(true)
      try {
        await loginWithGithub()
      } catch (err) {
        toast.error('GitHub 登录失败', {
          description: err instanceof Error ? err.message : '请稍后重试',
          position: 'top-center',
        })
        setGithubLoading(false)
      }
    }

    const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault()

      if (!name.trim()) {
        toast.error('请输入用户名')
        return
      }

      if (password.length < 8) {
        toast.error('密码长度至少为8位')
        return
      }

      if (password !== confirmPassword) {
        toast.error('两次输入的密码不一致')
        return
      }

      setLocalLoading(true)
      try {
        await register(name, email, password, confirmPassword)
        toast.success('注册成功', {
          description: `欢迎，${name}！`,
          position: 'top-center',
        })
      } catch (err) {
        toast.error('注册失败', {
          description: err instanceof Error ? err.message : '注册失败，请稍后重试',
          position: 'top-center',
        })
      } finally {
        setLocalLoading(false)
      }
    }

    const toggleMode = () => {
      setIsRegister(!isRegister)
      setName('')
      setConfirmPassword('')
    }

    if (isRegister) {
      return (
        <form onSubmit={handleRegister} className="flex w-full flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name" className="text-sm">
              用户名
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="请输入用户名"
              className="h-10"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-sm">
              邮箱
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => onEmailChange(e.target.value)}
              placeholder="请输入邮箱"
              className="h-10"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-sm">
              密码
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => onPasswordChange(e.target.value)}
              placeholder="请输入密码（至少8位）"
              className="h-10"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword" className="text-sm">
              确认密码
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="请再次输入密码"
              className="h-10"
              required
            />
          </div>
          <Button type="submit" className="h-10 w-full" disabled={localLoading}>
            {localLoading ? '注册中...' : '注册'}
          </Button>
          <div className="text-muted-foreground flex items-center justify-center gap-1 text-sm">
            <span>已有账号？</span>
            <Button
              variant="link"
              className="h-auto p-0 text-sm"
              type="button"
              onClick={toggleMode}
            >
              立即登录
            </Button>
          </div>
        </form>
      )
    }

    return (
      <form onSubmit={onSubmit} className="flex w-full flex-col gap-4">
        {/* GitHub 登录 - 放在最上面 */}
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full"
          onClick={handleGithubLogin}
          disabled={githubLoading}
        >
          <Github className="mr-2 h-4 w-4" />
          {githubLoading ? '跳转中...' : '使用 GitHub 登录'}
        </Button>

        {/* 分隔线 */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">或</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-sm">
            邮箱
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={e => onEmailChange(e.target.value)}
            placeholder="请输入邮箱"
            autoFocus={false}
            className="h-10"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password" className="text-sm">
            密码
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={e => onPasswordChange(e.target.value)}
            placeholder="请输入密码"
            className="h-10"
            required
          />
        </div>
        <Button type="submit" className="h-10 w-full" disabled={loading}>
          {loading ? '登录中...' : '登录'}
        </Button>

        <div className="text-muted-foreground flex items-center justify-center gap-1 text-sm">
          <span>还没有账号？</span>
          <Button variant="link" className="h-auto p-0 text-sm" type="button" onClick={toggleMode}>
            立即注册
          </Button>
        </div>
      </form>
    )
  }
)

LoginForm.displayName = 'LoginForm'
