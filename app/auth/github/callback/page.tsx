'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/stores/authStore'
import type { User } from '@/app'

export default function GithubCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const { setUser, setToken } = useAuthStore()

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get('token')
      const userJson = urlParams.get('user')

      if (!token || !userJson) {
        setError('登录信息不完整')
        return
      }

      try {
        const user = JSON.parse(decodeURIComponent(userJson)) as User

        // 存储 token 和用户信息
        await setToken(token)
        setUser(user)

        // 存储到 localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth-token', token)
        }

        // 跳转到首页
        router.push('/')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'GitHub 登录失败')
      }
    }

    handleCallback()
  }, [setToken, setUser, router])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">登录失败</h1>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">正在通过 GitHub 登录...</h1>
      </div>
    </div>
  )
}
