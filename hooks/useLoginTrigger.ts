import { useCallback } from 'react'
import useAuthStore from '@/stores/authStore'
import { toast } from 'sonner'

export function useLoginTrigger() {
  const { isAuthenticated } = useAuthStore()

  const triggerLogin = useCallback(() => {
    if (isAuthenticated) {
      return true
    }

    // 显示提示信息
    toast.error('请先登录', {
      description: '正在为您打开登录界面...',
      duration: 2000,
    })

    // 尝试找到并点击登录按钮
    setTimeout(() => {
      // 1. 优先查找启动器中带有 data-login-trigger 属性的登录按钮
      const loginTriggerButton = document.querySelector('[data-login-trigger]') as HTMLButtonElement
      if (loginTriggerButton) {
        loginTriggerButton.click()
        return
      }

      // 2. 查找启动器栏中的登录按钮
      const launcherBar = document.getElementById('app-launcher-bar')
      if (launcherBar) {
        const launcherLoginButtons = launcherBar.querySelectorAll('button')
        for (const button of launcherLoginButtons) {
          const buttonText = button.textContent?.trim().toLowerCase()
          if (buttonText === '登录' || buttonText === 'login') {
            button.click()
            return
          }
        }
      }

      // 3. 查找页面中其他可能的登录按钮
      const allButtons = document.querySelectorAll('button')
      for (const button of allButtons) {
        const buttonText = button.textContent?.trim().toLowerCase()
        if (buttonText === '登录' || buttonText === 'login') {
          button.click()
          return
        }
      }

      // 4. 如果找不到登录按钮，显示提示
      toast.error('未找到登录按钮，请手动点击登录')
    }, 100)

    return false
  }, [isAuthenticated])

  const requireLogin = useCallback((callback: () => void) => {
    if (triggerLogin()) {
      callback()
    }
  }, [triggerLogin])

  const requireLoginAsync = useCallback(async (callback: () => Promise<void>) => {
    if (triggerLogin()) {
      await callback()
    }
  }, [triggerLogin])

  return {
    isAuthenticated,
    triggerLogin,
    requireLogin,
    requireLoginAsync
  }
} 