import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { COPY_FEEDBACK_DURATION, type CopyType } from '../constants'

// 独立的剪贴板写入函数，支持回退机制
const writeToClipboard = async (text: string): Promise<boolean> => {
  // 优先使用 Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Clipboard API 失败，可能需要 HTTPS 或用户权限
    }
  }

  // 回退方案：使用 document.execCommand (已废弃但仍然有效)
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '-9999px'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const result = document.execCommand('copy')
    document.body.removeChild(textarea)
    return result
  } catch {
    return false
  }
}

export const useCopyFeedback = () => {
  const [copyStates, setCopyStates] = useState<{ [k in CopyType]: boolean }>({
    timestamp: false,
    dateTime: false,
  })

  // 使用 ref 存储 timeout ID，支持手动清除
  const timeoutRefs = useRef<{ [k in CopyType]?: NodeJS.Timeout }>({})

  // 清除特定类型的 timeout
  const clearCopyTimeout = useCallback((type: CopyType) => {
    if (timeoutRefs.current[type]) {
      clearTimeout(timeoutRefs.current[type])
      delete timeoutRefs.current[type]
    }
  }, [])

  const copyToClipboard = useCallback(
    async (text: string, type: CopyType) => {
      // 如果之前有 timeout，先清除
      clearCopyTimeout(type)

      const success = await writeToClipboard(text)

      if (success) {
        // 设置复制成功状态
        setCopyStates(prev => ({ ...prev, [type]: true }))

        // 设置定时器重置状态
        timeoutRefs.current[type] = setTimeout(() => {
          setCopyStates(prev => ({ ...prev, [type]: false }))
          delete timeoutRefs.current[type]
        }, COPY_FEEDBACK_DURATION)

        toast('已复制到剪贴板', {
          description: text,
          duration: COPY_FEEDBACK_DURATION,
        })
      } else {
        toast.error('复制失败，请手动复制')
      }
    },
    [clearCopyTimeout]
  )

  // 组件卸载时清理所有 timeout
  const cleanup = useCallback(() => {
    Object.values(timeoutRefs.current).forEach(timeout => {
      if (timeout) clearTimeout(timeout)
    })
    timeoutRefs.current = {}
  }, [])

  return {
    copyStates,
    copyToClipboard,
    cleanup,
  }
}
