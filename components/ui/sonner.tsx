'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group toaster-center-right"
      position="top-right"
      dir="ltr"
      offset={{ top: 0, right: 16 }}
      mobileOffset={{ top: 0, right: 16 }}
      expand
      richColors
      style={
        {
          '--width': 'auto',
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
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
