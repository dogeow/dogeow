'use client'

import './novel-editor.css'
import { EditorContent, EditorRoot, type JSONContent } from 'novel'
import { useEffect, useState } from 'react'
import hljs from 'highlight.js'
import { Markdown } from 'tiptap-markdown'
import { StarterKit } from 'novel'
import { cx } from 'class-variance-authority'

// 简化的预览扩展，只包含基本的 Markdown 渲染功能
const previewExtensions = [
  StarterKit.configure({
    codeBlock: false,
    bulletList: {
      HTMLAttributes: {
        class: cx('list-disc list-outside leading-relaxed space-y-1'),
      },
    },
    orderedList: {
      HTMLAttributes: {
        class: cx('list-decimal list-outside leading-relaxed space-y-1'),
      },
    },
    listItem: {
      HTMLAttributes: {
        class: cx('leading-relaxed'),
      },
    },
    blockquote: {
      HTMLAttributes: {
        class: cx('border-l-4 border-primary/20 pl-6 py-2 my-6 italic text-muted-foreground'),
      },
    },
    code: {
      HTMLAttributes: {
        class: cx(
          'rounded-md bg-muted px-1.5 py-0.5 font-mono text-sm font-medium text-foreground'
        ),
        spellcheck: 'false',
      },
    },
    horizontalRule: {
      HTMLAttributes: {
        class: cx('my-8 border-t border-border'),
      },
    },
    dropcursor: false,
    gapcursor: false,
    paragraph: {
      HTMLAttributes: {
        class: cx('leading-relaxed mb-4'),
      },
    },
    heading: {
      HTMLAttributes: {
        class: cx('font-bold tracking-tight'),
      },
    },
  }),
  Markdown.configure({
    html: true,
    tightLists: true,
    tightListClass: 'tight',
    bulletListMarker: '-',
    linkify: false,
    breaks: false,
    transformPastedText: false,
    transformCopiedText: false,
  }),
]

interface MarkdownPreviewProps {
  content: string
  className?: string
}

const MarkdownPreview = ({ content, className }: MarkdownPreviewProps) => {
  const [jsonContent, setJsonContent] = useState<JSONContent | null>(null)

  // 将 Markdown 字符串转换为 JSONContent
  useEffect(() => {
    if (content) {
      // 简化的 Markdown 到 JSON 转换
      const lines = content.split('\n')
      const contentArray: JSONContent[] = []

      let currentList: JSONContent | null = null
      let currentListType: 'bulletList' | 'orderedList' | null = null

      lines.forEach(line => {
        const trimmedLine = line.trim()
        if (!trimmedLine) {
          if (currentList) {
            contentArray.push(currentList)
            currentList = null
            currentListType = null
          }
          return
        }

        if (trimmedLine.startsWith('# ')) {
          // H1
          contentArray.push({
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: trimmedLine.substring(2) }],
          })
        } else if (trimmedLine.startsWith('## ')) {
          // H2
          contentArray.push({
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: trimmedLine.substring(3) }],
          })
        } else if (trimmedLine.startsWith('### ')) {
          // H3
          contentArray.push({
            type: 'heading',
            attrs: { level: 3 },
            content: [{ type: 'text', text: trimmedLine.substring(4) }],
          })
        } else if (trimmedLine.startsWith('- ')) {
          // List item
          if (currentListType !== 'bulletList') {
            if (currentList) {
              contentArray.push(currentList)
            }
            currentList = {
              type: 'bulletList',
              content: [],
            }
            currentListType = 'bulletList'
          }
          if (currentList && currentList.content) {
            ;(currentList.content as JSONContent[]).push({
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: trimmedLine.substring(2) }],
                },
              ],
            })
          }
        } else if (trimmedLine.startsWith('1. ')) {
          // Ordered list item
          if (currentListType !== 'orderedList') {
            if (currentList) {
              contentArray.push(currentList)
            }
            currentList = {
              type: 'orderedList',
              content: [],
            }
            currentListType = 'orderedList'
          }
          if (currentList && currentList.content) {
            ;(currentList.content as JSONContent[]).push({
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: trimmedLine.substring(3) }],
                },
              ],
            })
          }
        } else if (trimmedLine.startsWith('> ')) {
          // Blockquote
          contentArray.push({
            type: 'blockquote',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: trimmedLine.substring(2) }],
              },
            ],
          })
        } else if (trimmedLine.startsWith('```')) {
          // Code block
          contentArray.push({
            type: 'codeBlock',
            attrs: { language: 'text' },
            content: [{ type: 'text', text: '' }],
          })
        } else {
          // Regular paragraph
          contentArray.push({
            type: 'paragraph',
            content: [{ type: 'text', text: trimmedLine }],
          })
        }
      })

      // 添加最后一个列表
      if (currentList) {
        contentArray.push(currentList)
      }

      const jsonContent: JSONContent = {
        type: 'doc',
        content: contentArray,
      }

      setJsonContent(jsonContent)
    }
  }, [content])

  // 应用代码高亮
  const highlightCodeblocks = () => {
    setTimeout(() => {
      const codeBlocks = document.querySelectorAll('pre code:not(.hljs)')
      codeBlocks.forEach(block => {
        if (block instanceof HTMLElement) {
          try {
            hljs.highlightElement(block)
          } catch (error) {
            console.warn('Failed to highlight code block:', error)
          }
        }
      })
    }, 100)
  }

  useEffect(() => {
    if (jsonContent) {
      highlightCodeblocks()
    }
  }, [jsonContent])

  if (!jsonContent) return null

  return (
    <div className={`relative w-full ${className || ''}`}>
      <EditorRoot>
        <EditorContent
          initialContent={jsonContent}
          extensions={previewExtensions}
          className="prose prose-neutral dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-6 prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-5 prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-4 prose-p:leading-relaxed prose-p:text-foreground prose-strong:font-semibold prose-strong:text-foreground prose-em:text-foreground prose-code:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-muted prose-pre:border prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto prose-blockquote:border-l-4 prose-blockquote:border-primary/20 prose-blockquote:pl-6 prose-blockquote:py-2 prose-blockquote:my-6 prose-blockquote:italic prose-blockquote:text-muted-foreground prose-ul:space-y-1 prose-ol:space-y-1 prose-li:leading-relaxed prose-hr:my-8 prose-hr:border-t prose-hr:border-border prose-a:text-primary prose-a:underline prose-a:underline-offset-[3px] hover:prose-a:text-primary/80 prose-img:rounded-lg prose-img:border prose-img:border-border prose-img:my-6 max-w-none font-sans focus:outline-none"
          editable={false}
          editorProps={{
            attributes: {
              class:
                'prose prose-neutral dark:prose-invert max-w-none font-sans focus:outline-none',
            },
          }}
        />
      </EditorRoot>
    </div>
  )
}

export default MarkdownPreview
