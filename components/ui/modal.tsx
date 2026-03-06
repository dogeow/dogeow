'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/helpers'

/**
 * Modal 对话框组件的 Props 接口
 */
export interface ModalProps {
  /** 对话框是否打开 */
  open: boolean
  /** 打开/关闭状态改变回调 */
  onOpenChange: (open: boolean) => void
  /** 对话框标题 */
  title?: React.ReactNode
  /** 对话框内容 */
  children?: React.ReactNode
  /** 传递给内容容器的样式类名 */
  className?: string
  /** 传递给 DialogContent 的样式类名 */
  contentClassName?: string
  /** 预设大小 */
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

// ✅ 重导出及类型
export const ModalHeader = DialogHeader
export const ModalTitle = DialogTitle

export default Modal
