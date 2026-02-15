/**
 * Note 模块的实用函数
 */

import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { Note } from '../types/note'
import { extractTextFromJSON } from '@/lib/helpers/wordCount'

const CONTENT_PREVIEW_MAX_LENGTH = 150

/**
 * 格式化日期
 */
export const formatDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })
  } catch {
    return dateString
  }
}

/**
 * 从 HTML 或 Markdown 内容中获取预览文本
 */
export const getContentPreview = (
  content: string,
  maxLength = CONTENT_PREVIEW_MAX_LENGTH
): string => {
  if (!content) return ''

  const plainText = content
    .replace(/<[^>]*>/g, '')
    .replace(/[#*`>-]/g, '')
    .trim()

  return plainText.length > maxLength ? `${plainText.substring(0, maxLength)}...` : plainText
}

/**
 * 从编辑器 JSON 中提取文本
 */
const extractTextFromEditorJSON = (jsonContent: unknown): string => {
  if (!jsonContent || typeof jsonContent !== 'object') {
    return ''
  }

  let text = ''

  function traverse(node: unknown): void {
    if (!node || typeof node !== 'object') return

    const nodeObj = node as Record<string, unknown>

    if (nodeObj.type === 'text' && typeof nodeObj.text === 'string') {
      text += nodeObj.text
    } else if (nodeObj.type === 'paragraph' && text && !text.endsWith('\n')) {
      if (text.length > 0) {
        text += '\n'
      }
    }

    if (nodeObj.content && Array.isArray(nodeObj.content)) {
      nodeObj.content.forEach(traverse)
    }
  }

  traverse(jsonContent)
  return text.trim()
}

/**
 * 判断笔记是否有内容
 */
export const hasNoteContent = (note: Note): boolean => {
  if (note.content_markdown && note.content_markdown.trim()) {
    return true
  }

  if (note.content) {
    try {
      const parsedContent = JSON.parse(note.content)
      let extractedText = extractTextFromJSON(parsedContent)

      if (!extractedText || !extractedText.trim()) {
        extractedText = extractTextFromEditorJSON(parsedContent)
      }

      return extractedText.trim().length > 0
    } catch {
      return note.content.trim().length > 0
    }
  }

  return false
}

/**
 * 获取笔记预览文本
 */
export const getNotePreviewText = (note: Note, maxLength = CONTENT_PREVIEW_MAX_LENGTH): string => {
  if (note.content_markdown && note.content_markdown.trim()) {
    return getContentPreview(note.content_markdown, maxLength)
  }

  if (note.content && note.content.trim()) {
    const trimmedContent = note.content.trim()
    if (trimmedContent.startsWith('{') || trimmedContent.startsWith('[')) {
      try {
        const parsedContent = JSON.parse(trimmedContent)

        if (process.env.NODE_ENV === 'development') {
          console.log('笔记JSON结构:', parsedContent)
        }

        let extractedText = extractTextFromJSON(parsedContent)

        if (!extractedText || !extractedText.trim()) {
          extractedText = extractTextFromEditorJSON(parsedContent)
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('提取的文本:', extractedText)
        }

        if (extractedText && extractedText.trim()) {
          const cleanedText = extractedText.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim()

          return cleanedText.length > maxLength
            ? `${cleanedText.substring(0, maxLength)}...`
            : cleanedText
        }

        return ''
      } catch (error) {
        console.warn('解析笔记JSON内容失败:', error)
        return getContentPreview(note.content, maxLength)
      }
    } else {
      return getContentPreview(note.content, maxLength)
    }
  }

  return ''
}
