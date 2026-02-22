"use client"

import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/helpers'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: React.ReactNode
  children?: React.ReactNode
  className?: string
  contentClassName?: string
  // quick size preset
  size?: 'sm' | 'md' | 'lg' | 'full'
}

const sizeMap: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-4xl',
  full: 'w-full max-w-full h-full',
}

export function Modal({
  open,
  onOpenChange,
  title,
  children,
  className,
  contentClassName,
  size = 'md',
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // keep default DialogContent layout but allow overriding size and extra classes
          `flex h-[85vh] w-[calc(100vw-2rem)] ${sizeMap[size]} flex-col p-0`,
          contentClassName
        )}
      >
        {title ? (
          <DialogHeader className="sr-only">
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        ) : null}

        <div className={cn('flex-1 flex flex-col', className)}>{children}</div>
      </DialogContent>
    </Dialog>
  )
}

// Re-export header/title for explicit usage when needed
export const ModalHeader = DialogHeader
export const ModalTitle = DialogTitle

export default Modal
