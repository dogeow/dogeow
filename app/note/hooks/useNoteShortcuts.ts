import { useEffect } from 'react'

interface UseNoteShortcutsOptions {
  title: string
  isSaving: boolean
  onSave: () => void
  onTogglePrivacy: () => void
}

export function useNoteShortcuts({
  title,
  isSaving,
  onSave,
  onTogglePrivacy,
}: UseNoteShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S 或 Cmd+S 保存
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (title.trim() && !isSaving) {
          onSave()
        }
      }
      // Ctrl+Shift+P 或 Cmd+Shift+P 切换隐私状态
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        if (title.trim() && !isSaving) {
          onTogglePrivacy()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [title, isSaving, onSave, onTogglePrivacy])
}
