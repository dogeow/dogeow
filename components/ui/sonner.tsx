'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      position="top-right"
      toastOptions={{
        style: {
          marginTop: '60px', // 为顶部导航栏留出空间
        },
        classNames: {
          success: 'toast-success',
          error: 'toast-error',
          warning: 'toast-warning',
          info: 'toast-info',
        },
        // 为不同类型的 toast 设置不同的样式
        success: {
          style: {
            background: isDark ? '#16a34a' : '#22c55e', // 绿色
            color: '#ffffff',
            borderColor: isDark ? '#16a34a' : '#22c55e',
          },
        },
        error: {
          style: {
            background: isDark ? '#dc2626' : '#ef4444', // 红色
            color: '#ffffff',
            borderColor: isDark ? '#dc2626' : '#ef4444',
          },
        },
        warning: {
          style: {
            background: isDark ? '#ea580c' : '#f97316', // 橘色
            color: '#ffffff',
            borderColor: isDark ? '#ea580c' : '#f97316',
          },
        },
        info: {
          style: {
            background: isDark ? '#2563eb' : '#3b82f6', // 蓝色
            color: '#ffffff',
            borderColor: isDark ? '#2563eb' : '#3b82f6',
          },
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
