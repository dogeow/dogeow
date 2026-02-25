'use client'

import './novel-editor.css'
import { EditorContent, EditorRoot, type JSONContent } from 'novel'
import { useEffect } from 'react'
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
] as any

interface ReadonlyEditorProps {
  content?: JSONContent | null
  className?: string
}

const ReadonlyEditor = ({ content, className }: ReadonlyEditorProps) => {
  const displayContent = content ?? null

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
    if (displayContent) {
      highlightCodeblocks()
    }
  }, [displayContent])

  if (!displayContent) return null

  return (
    <div className={`relative w-full px-4 ${className || ''}`}>
      <EditorRoot key={displayContent ? 'loaded' : 'empty'}>
        <EditorContent
          initialContent={displayContent}
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
