'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'
import { toast } from 'sonner'
import { LoginForm } from '@/components/launcher/auth/LoginForm'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import useAuthStore from '@/stores/authStore'

export function RpgRegistrationGate() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading, isAuthenticated } = useAuthStore()

  if (isAuthenticated) {
    return null
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    try {
      await login(email, password)
      toast.success('登录成功', {
        description: `欢迎回来，${email}`,
        position: 'top-center',
      })
    } catch (error) {
      toast.error('登录失败', {
        description: error instanceof Error ? error.message : '登录失败，请检查邮箱和密码',
        position: 'top-center',
      })
    }
  }

  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent
        className="w-[92%] max-w-md overflow-hidden p-0 [&>button]:hidden"
        onEscapeKeyDown={event => event.preventDefault()}
        onPointerDownOutside={event => event.preventDefault()}
      >
        <div className="px-6 pt-6">
          <DialogTitle className="text-center text-xl font-semibold">开始你的冒险</DialogTitle>
          <DialogDescription className="mt-2 text-center">
            先注册一个账号；如果你已经有账号，也可以直接切换到登录。
          </DialogDescription>
        </div>
        <div className="px-6 pb-6">
          <LoginForm
            email={email}
            password={password}
            loading={loading}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={handleSubmit}
            initialMode="register"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
