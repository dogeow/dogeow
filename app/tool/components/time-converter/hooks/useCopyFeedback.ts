import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { COPY_FEEDBACK_DURATION, type CopyType } from '../constants'

export const useCopyFeedback = () => {
  const [copyStates, setCopyStates] = useState<{ [k in CopyType]: boolean }>({
    timestamp: false,
    dateTime: false,
  })

  const copyToClipboard = useCallback(async (text: string, type: CopyType) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyStates(prev => ({ ...prev, [type]: true }))
      setTimeout(() => setCopyStates(prev => ({ ...prev, [type]: false })), COPY_FEEDBACK_DURATION)
      toast('已复制到剪贴板', {
        description: text,
        duration: COPY_FEEDBACK_DURATION,
      })
    } catch (error) {
      console.error('复制失败:', error)
      toast.error('复制失败')
    }
  }, [])

  return { copyStates, copyToClipboard }
}
