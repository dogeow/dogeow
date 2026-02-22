'use client'

import React, { useMemo } from 'react'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { cn } from '@/lib/helpers'

const processor = unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeStringify)

interface SimpleMarkdownProps {
  content: string
  className?: string
}

/**
 * 轻量 Markdown 渲染，仅用 remark/rehype，不依赖 novel。
 * 用于 AI 聊天等场景，避免将 novel 打入 launcher 等共享布局的 chunk。
 */
export function SimpleMarkdown({ content, className }: SimpleMarkdownProps) {
  const html = useMemo(() => {
    if (!content?.trim()) return ''
    try {
      return processor.processSync(content).toString()
    } catch {
      return ''
    }
  }, [content])

  if (!html) {
    return <span className={cn('whitespace-pre-wrap', className)}>{content || '\u00A0'}</span>
  }

  return (
    <div
      className={cn(
        'prose prose-sm dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 max-w-none',
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
