import { useState, useRef, useEffect, useCallback } from 'react'

export const useInlineEdit = () => {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // 自动聚焦到输入框
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

  const startEdit = useCallback((id: number, currentValue: string) => {
    setEditingId(id)
    setEditingValue(currentValue)
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setEditingValue('')
  }, [])

  const handleKeyDown = useCallback((
    e: React.KeyboardEvent,
    onSave: () => void,
    onCancel: () => void
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }, [])

  return {
    editingId,
    editingValue,
    setEditingValue,
    inputRef,
    startEdit,
    cancelEdit,
    handleKeyDown,
    isEditing: (id: number) => editingId === id
  }
} 