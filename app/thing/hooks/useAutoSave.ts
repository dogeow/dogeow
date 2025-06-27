import { useCallback, useRef, useState, useEffect } from 'react'

interface UseAutoSaveOptions<T> {
  onSave: (data: T) => Promise<void>
  delay?: number
  initialData?: T
}

interface UseAutoSaveReturn {
  autoSaving: boolean
  lastSaved: Date | null
  triggerAutoSave: () => void
  setInitialData: (data: any) => void
}

export function useAutoSave<T>({
  onSave,
  delay = 2000,
  initialData
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const initialDataRef = useRef<T | null>(initialData || null)

  const autoSave = useCallback(async () => {
    if (!initialDataRef.current) return
    
    setAutoSaving(true)
    try {
      await onSave(initialDataRef.current)
      setLastSaved(new Date())
    } catch (error) {
      console.error("自动保存失败:", error)
      // 自动保存失败不显示错误提示，避免打扰用户
    } finally {
      setAutoSaving(false)
    }
  }, [onSave])

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave()
    }, delay)
  }, [autoSave, delay])

  const setInitialData = useCallback((data: T) => {
    initialDataRef.current = data
  }, [])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  return {
    autoSaving,
    lastSaved,
    triggerAutoSave,
    setInitialData
  }
} 