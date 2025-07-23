import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/stores/authStore'
import { toast } from 'sonner'

interface AuthGuardOptions {
  redirectTo?: string
  showToast?: boolean
  toastMessage?: string
}

export function useAuthGuard() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()

  const checkAuth = useCallback(
    (options: AuthGuardOptions = {}) => {
      const { redirectTo, showToast = true, toastMessage = '请先登录' } = options

      if (!isAuthenticated) {
        if (showToast) {
          toast.error(toastMessage)
        }

        if (redirectTo) {
          router.push(redirectTo)
        }

        return false
      }

      return true
    },
    [isAuthenticated, router]
  )

  const requireAuth = useCallback(
    (callback: () => void, options: AuthGuardOptions = {}) => {
      if (checkAuth(options)) {
        callback()
      }
    },
    [checkAuth]
  )

  const requireAuthAsync = useCallback(
    async (callback: () => Promise<void>, options: AuthGuardOptions = {}) => {
      if (checkAuth(options)) {
        await callback()
      }
    },
    [checkAuth]
  )

  return {
    isAuthenticated,
    checkAuth,
    requireAuth,
    requireAuthAsync,
  }
}
