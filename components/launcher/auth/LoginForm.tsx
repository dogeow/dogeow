'use client'

import React, { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
    return (
      <form onSubmit={onSubmit} className="flex w-full items-center gap-2">
        <Input
          type="email"
          value={email}
          onChange={e => onEmailChange(e.target.value)}
          placeholder="邮箱"
          className="h-8"
          required
        />
        <Input
          type="password"
          value={password}
          onChange={e => onPasswordChange(e.target.value)}
          placeholder="密码"
          className="h-8"
          required
        />
        <Button type="submit" className="h-8" disabled={loading}>
          {loading ? '登录中...' : '登录'}
        </Button>
      </form>
    )
  }
)

LoginForm.displayName = 'LoginForm'
