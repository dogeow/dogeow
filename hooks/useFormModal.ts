import { useState, useCallback } from 'react'

export interface UseFormModalReturn<T = number | null, M = string> {
  open: boolean
  selectedId: T
  mode: M
  setOpen: (open: boolean) => void
  setSelectedId: (id: T) => void
  setMode: (mode: M) => void
  openModal: (id: T, mode?: M) => void
  closeModal: () => void
}

/**
 * Generic hook that encapsulates the common open/close + selection
 * logic used by many modal dialogs (edit/view forms, detail popups, etc).
 *
 * The type parameters allow callers to customise the identifier type
 * and the string literal union used for mode ("view" | "edit" etc).
 */
export function useFormModal<T = number | null, M extends string = string>(
  initialMode: M
): UseFormModalReturn<T, M> {
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<T>(null as any)
  const [mode, setMode] = useState<M>(initialMode)

  const openModal = useCallback((id: T, modeOverride?: M) => {
    setSelectedId(id)
    if (modeOverride !== undefined) {
      setMode(modeOverride)
    }
    setOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setOpen(false)
    setSelectedId(null as any)
    setMode(initialMode)
  }, [initialMode])

  return {
    open,
    selectedId,
    mode,
    setOpen,
    setSelectedId,
    setMode,
    openModal,
    closeModal,
  }
}
