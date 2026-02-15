'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'
import { useToastStore } from '@/stores/toastStore'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()
  const { position, duration } = useToastStore()

  // 根据位置动态调整 offset
  const getOffset = () => {
    if (position.includes('top')) {
      return { top: 16 }
    }
    if (position.includes('bottom')) {
      return { bottom: 80, right: 16 }
    }
    // 两侧位置
    return { top: 16, bottom: 80 }
  }

  const offset = getOffset()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      position="top-center"
      dir="ltr"
      offset={62}
      mobileOffset={62}
      duration={duration}
      richColors
      style={
        {
          top: '62px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: 'sonner-toast-custom',
          success: 'toast-success',
          error: 'toast-error',
          warning: 'toast-warning',
          info: 'toast-info',
        },
        style: {
          width: 'auto',
          maxWidth: 'none',
          zIndex: 9999,
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
