import { useState, useRef, useCallback } from 'react'

type DialogAction = 'saveDraft' | 'save' | 'discard'

interface UseNoteDialogsOptions {
  onAction: (action: DialogAction, title: string, content: string) => Promise<void>
  title: string
  content: string
}

export function useNoteDialogs({ onAction, title, content }: UseNoteDialogsOptions) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  const [globalDialogOpen, setGlobalDialogOpen] = useState(false)
  const globalDialogPromiseRef = useRef<{ resolve: (value: boolean) => void } | null>(null)

  // 离开弹窗相关操作
  const handleLeave = useCallback(
    async (action: DialogAction) => {
      await onAction(action, title, content)
      if (pendingAction) pendingAction()
      setShowConfirmDialog(false)
      setPendingAction(null)
    },
    [onAction, title, content, pendingAction]
  )

  // 全局弹窗相关操作
  const handleGlobalAction = useCallback(
    async (action: DialogAction) => {
      await onAction(action, title, content)
      setGlobalDialogOpen(false)
      globalDialogPromiseRef.current?.resolve(true)
    },
    [onAction, title, content]
  )

  // 封装 showDialog，返回 Promise<boolean>
  const showDialog = useCallback(() => {
    setGlobalDialogOpen(true)
    return new Promise<boolean>(resolve => {
      globalDialogPromiseRef.current = { resolve }
    })
  }, [])

  return {
    showConfirmDialog,
    setShowConfirmDialog,
    setPendingAction,
    globalDialogOpen,
    setGlobalDialogOpen,
    handleLeave,
    handleGlobalAction,
    showDialog,
  }
}
