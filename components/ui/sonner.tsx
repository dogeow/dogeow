'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group toaster-bottom-right"
      position="bottom-right"
      dir="ltr"
      offset={{ bottom: 80, right: 16 }}
      mobileOffset={{ bottom: 80, right: 16 }}
      expand
      richColors
      style={
        {
          '--width': 'auto',
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
          maxWidth: '400px',
          zIndex: 9999,
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
