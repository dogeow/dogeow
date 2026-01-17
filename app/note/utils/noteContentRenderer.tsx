import React from 'react'
import ReadonlyEditor from '@/components/novel-editor/readonly'

/**
 * 判断编辑器内容是否为空
 */
export function isEditorContentEmpty(parsedContent: {
  content?: Array<{ type: string; content?: Array<{ text: string }> }>
}): boolean {
  if (!parsedContent?.content || parsedContent.content.length === 0) {
    return true
  }
  if (parsedContent.content.length === 1) {
    const firstBlock = parsedContent.content[0]
    if (firstBlock.type === 'paragraph') {
      if (!firstBlock.content || firstBlock.content.length === 0) {
        return true
      }
      if (firstBlock.content.length === 1 && firstBlock.content[0].text === '') {
        return true
      }
    }
  }
  return false
}

/**
 * 渲染笔记内容
 */
export function renderNoteContent(content: string) {
  try {
    const parsedContent = JSON.parse(content)
    if (isEditorContentEmpty(parsedContent)) {
      return (
        <div className="prose max-w-none py-8">
          <span className="text-gray-500 italic">(无内容)</span>
        </div>
      )
    }
    try {
      return <ReadonlyEditor content={parsedContent} />
    } catch (renderError) {
      console.error('ReadonlyEditor render failed:', renderError)
      return (
        <div className="prose max-w-none py-8">
          <span className="text-gray-500 italic">(内容渲染失败)</span>
        </div>
      )
    }
  } catch (error) {
    console.error('Failed to parse note content:', error)
    return (
      <div className="prose max-w-none py-8">
        <pre className="whitespace-pre-wrap">{content}</pre>
      </div>
    )
  }
}
