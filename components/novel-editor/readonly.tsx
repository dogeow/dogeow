'use client'

import './novel-editor.css'
import { EditorContent, EditorRoot, type JSONContent } from 'novel'
import { useEffect, useState } from 'react'
import hljs from 'highlight.js'

import {
  StarterKit,
  TaskItem,
  TaskList,
  Mathematics,
  HighlightExtension,
  TiptapUnderline,
  TiptapImage,
  TiptapLink,
} from 'novel'
import { CodeBlock } from '@tiptap/extension-code-block'
import { Markdown } from 'tiptap-markdown'
import { cx } from 'class-variance-authority'

const readonlyExtensions = [
  StarterKit.configure({
    // 禁用内置的 codeBlock，因为我们要使用带高亮的版本
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
    dropcursor: {
      color: '#DBEAFE',
      width: 4,
    },
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
  TiptapLink.configure({
    HTMLAttributes: {
      class: cx(
        'text-primary underline underline-offset-[3px] hover:text-primary/80 transition-colors cursor-pointer'
      ),
    },
  }),
  TiptapImage.configure({
    allowBase64: true,
    HTMLAttributes: {
      class: cx('rounded-lg border border-border my-6'),
    },
  }),
  TaskList.configure({
    HTMLAttributes: {
      class: cx('pl-2 space-y-2'),
    },
  }),
  TaskItem.configure({
    HTMLAttributes: {
      class: cx('flex gap-2 items-start'),
    },
    nested: true,
  }),
  CodeBlock.configure({
    HTMLAttributes: {
      class: cx('rounded-lg bg-muted border font-mono text-sm p-4 my-6 overflow-x-auto'),
    },
  }),
  Mathematics.configure({
    HTMLAttributes: {
      class: cx('text-foreground rounded p-1 hover:bg-accent cursor-pointer'),
    },
    katexOptions: {
      throwOnError: false,
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
  HighlightExtension,
  TiptapUnderline,
]

interface ReadonlyEditorProps {
  content?: JSONContent | null
  className?: string
}

const ReadonlyEditor = ({ content, className }: ReadonlyEditorProps) => {
  const [initialContent, setInitialContent] = useState<JSONContent | null>(null)

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
    if (content) {
      setInitialContent(content)
    }
  }, [content])

  useEffect(() => {
    if (initialContent) {
      highlightCodeblocks()
    }
  }, [initialContent])

  if (!initialContent) return null

  return (
    <div className={`note-content relative w-full ${className || ''}`}>
      <EditorRoot>
        <EditorContent
          initialContent={initialContent}
          extensions={readonlyExtensions}
          className="prose prose-neutral dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-8 prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-6 prose-h3:text-xl prose-h3:mb-3 prose-h3:mt-5 prose-p:leading-relaxed prose-p:text-foreground prose-p:mb-4 prose-strong:font-semibold prose-strong:text-foreground prose-em:text-foreground prose-code:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-muted prose-pre:border prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto prose-blockquote:border-l-4 prose-blockquote:border-primary/20 prose-blockquote:pl-6 prose-blockquote:py-2 prose-blockquote:my-6 prose-blockquote:italic prose-blockquote:text-muted-foreground prose-ul:space-y-1 prose-ol:space-y-1 prose-li:leading-relaxed prose-hr:my-8 prose-hr:border-t prose-hr:border-border prose-a:text-primary prose-a:underline prose-a:underline-offset-[3px] hover:prose-a:text-primary/80 prose-img:rounded-lg prose-img:border prose-img:border-border prose-img:my-6 max-w-none font-sans focus:outline-none"
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

export default ReadonlyEditor
