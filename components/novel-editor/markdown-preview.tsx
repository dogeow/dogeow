'use client'

import './novel-editor.css'
import { EditorContent, EditorRoot, type JSONContent } from 'novel'
import { useEffect, useState, useMemo, startTransition } from 'react'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import css from 'highlight.js/lib/languages/css'
import xml from 'highlight.js/lib/languages/xml'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'
import sql from 'highlight.js/lib/languages/sql'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import java from 'highlight.js/lib/languages/java'
import cpp from 'highlight.js/lib/languages/cpp'
import csharp from 'highlight.js/lib/languages/csharp'
import php from 'highlight.js/lib/languages/php'
import ruby from 'highlight.js/lib/languages/ruby'
import swift from 'highlight.js/lib/languages/swift'
import kotlin from 'highlight.js/lib/languages/kotlin'
import yaml from 'highlight.js/lib/languages/yaml'
import markdown from 'highlight.js/lib/languages/markdown'

// 注册常用语言
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('py', python)
hljs.registerLanguage('css', css)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('json', json)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('shell', bash)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('go', go)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('java', java)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('c++', cpp)
hljs.registerLanguage('csharp', csharp)
hljs.registerLanguage('c#', csharp)
hljs.registerLanguage('php', php)
hljs.registerLanguage('ruby', ruby)
hljs.registerLanguage('swift', swift)
hljs.registerLanguage('kotlin', kotlin)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('yml', yaml)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('md', markdown)

import { Markdown } from 'tiptap-markdown'
import { StarterKit } from 'novel'
import { useEditor } from '@tiptap/react'
import { cx } from 'class-variance-authority'

// 简化的预览扩展，只包含基本的 Markdown 渲染功能
const previewExtensions = [
  StarterKit.configure({
    codeBlock: false,
    bulletList: {
      HTMLAttributes: {
        class: cx('list-disc list-outside pl-6 my-2 space-y-1'),
      },
    },
    orderedList: {
      HTMLAttributes: {
        class: cx('list-decimal list-outside pl-6 my-2 space-y-1'),
      },
    },
    listItem: {
      HTMLAttributes: {
        class: cx('pl-1 leading-relaxed'),
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
        class: cx('leading-relaxed my-2'),
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
] as any

interface MarkdownPreviewProps {
  content: string
  className?: string
}

const MarkdownPreview = ({ content, className }: MarkdownPreviewProps) => {
  const [jsonContent, setJsonContent] = useState<JSONContent | null>(null)

  // 创建一个临时编辑器实例来解析 markdown
  const parserEditor = useEditor({
    extensions: previewExtensions,
    content: '',
    editable: false,
  })

  // 使用 Tiptap 的 Markdown 扩展解析 markdown 字符串
  useEffect(() => {
    if (content && parserEditor) {
      try {
        // 使用编辑器的 setContent 方法和 markdown 扩展来解析
        parserEditor.commands.setContent(content)

        // 获取解析后的 JSONContent
        const parsedContent = parserEditor.getJSON()
        // 使用 startTransition 来避免在 effect 中同步调用 setState
        startTransition(() => {
          setJsonContent(parsedContent)
        })
      } catch (error) {
        console.error('Failed to parse markdown:', error)
        // 如果解析失败，使用简单的段落包装
        startTransition(() => {
          setJsonContent({
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: content }],
              },
            ],
          })
        })
      }
    }
  }, [content, parserEditor])

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
          className="prose prose-neutral dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground prose-h1:text-2xl prose-h1:mb-3 prose-h1:mt-4 prose-h2:text-xl prose-h2:mb-2 prose-h2:mt-4 prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-3 prose-p:leading-relaxed prose-p:text-foreground prose-p:my-2 prose-strong:font-semibold prose-strong:text-foreground prose-em:text-foreground prose-code:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-muted prose-pre:border prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto prose-pre:my-2 prose-blockquote:border-l-4 prose-blockquote:border-primary/20 prose-blockquote:pl-6 prose-blockquote:py-2 prose-blockquote:my-4 prose-blockquote:italic prose-blockquote:text-muted-foreground prose-ul:pl-6 prose-ul:my-2 prose-ul:space-y-1 prose-ol:pl-6 prose-ol:my-2 prose-ol:space-y-1 prose-li:leading-relaxed prose-li:pl-1 prose-li:my-0.5 prose-hr:my-4 prose-hr:border-t prose-hr:border-border prose-a:text-primary prose-a:underline prose-a:underline-offset-[3px] hover:prose-a:text-primary/80 prose-img:rounded-lg prose-img:border prose-img:border-border prose-img:my-4 max-w-none font-sans focus:outline-none"
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
