import { useCallback } from 'react'

export function useNoteContent() {
  // 获取当前编辑器内容和markdown
  const getCurrentContent = useCallback(() => {
    const content = window.localStorage.getItem('novel-content')
    const markdown = window.localStorage.getItem('markdown')
    return {
      content:
        content ||
        '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":""}]}]}',
      markdown: markdown || '',
    }
  }, [])

  return { getCurrentContent }
}
