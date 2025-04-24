"use client"

import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { createEditor, Descendant } from 'slate'
import { Slate, Editable, withReact } from 'slate-react'
import { withHistory } from 'slate-history'
import { Button } from "@/components/ui/button"
import { Save, FileText } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { put } from '@/utils/api'

// 简单的初始编辑器值
const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [
      { text: '开始编辑你的笔记...' },
    ],
  }
]

// 简化的Markdown解析函数
const deserialize = (markdownString: string): Descendant[] => {
  if (!markdownString.trim()) {
    return initialValue
  }
  
  // 简单的按行解析
  const lines = markdownString.split('\n')
  const nodes: Descendant[] = []
  
  lines.forEach(line => {
    if (line.startsWith('# ')) {
      nodes.push({
        type: 'heading-one',
        children: [{ text: line.substring(2) }]
      })
    } else if (line.startsWith('## ')) {
      nodes.push({
        type: 'heading-two',
        children: [{ text: line.substring(3) }]
      })
    } else if (line.startsWith('### ')) {
      nodes.push({
        type: 'heading-three',
        children: [{ text: line.substring(4) }]
      })
    } else if (line.startsWith('- ')) {
      nodes.push({
        type: 'list-item',
        children: [{ text: line.substring(2) }]
      })
    } else {
      nodes.push({
        type: 'paragraph',
        children: [{ text: line }]
      })
    }
  })
  
  return nodes.length ? nodes : initialValue
}

// 序列化为Markdown
const serialize = (nodes: Descendant[]): string => {
  return nodes
    .map(node => {
      // @ts-ignore - 简化实现
      if (node.text) {
        return node.text
      }
      
      // @ts-ignore - 简化实现
      const children = node.children.map(n => serialize([n])).join('')
      
      // @ts-ignore - 简化实现
      switch (node.type) {
        case 'paragraph':
          return `${children}\n\n`
        case 'heading-one':
          return `# ${children}\n\n`
        case 'heading-two':
          return `## ${children}\n\n`
        case 'heading-three':
          return `### ${children}\n\n`
        case 'list-item':
          return `- ${children}\n`
        default:
          return children
      }
    })
    .join('')
}

// 自定义渲染
// @ts-ignore - 简化实现
const Element = ({ attributes, children, element }) => {
  // @ts-ignore - 简化实现
  switch (element.type) {
    case 'heading-one':
      return <h1 {...attributes} className="text-3xl font-bold my-4">{children}</h1>
    case 'heading-two':
      return <h2 {...attributes} className="text-2xl font-bold my-3">{children}</h2>
    case 'heading-three':
      return <h3 {...attributes} className="text-xl font-bold my-2">{children}</h3>
    case 'list-item':
      return <li {...attributes}>{children}</li>
    default:
      return <p {...attributes} className="my-2">{children}</p>
  }
}

// @ts-ignore - 简化实现
const Leaf = ({ attributes, children, leaf }) => {
  let renderedChildren = children
  
  if (leaf.bold) {
    renderedChildren = <strong>{renderedChildren}</strong>
  }

  if (leaf.italic) {
    renderedChildren = <em>{renderedChildren}</em>
  }

  if (leaf.code) {
    renderedChildren = <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">{renderedChildren}</code>
  }

  return <span {...attributes}>{renderedChildren}</span>
}

// 主编辑器组件
interface MarkdownEditorProps {
  noteId: number
  initialContent?: string
}

const MarkdownEditorSimple = ({ noteId, initialContent = '' }: MarkdownEditorProps) => {
  const [value, setValue] = useState<Descendant[]>(initialValue)
  const [markdownValue, setMarkdownValue] = useState(initialContent)
  const [showMarkdown, setShowMarkdown] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const editor = useMemo(() => withHistory(withReact(createEditor())), [])

  // 初始化编辑器
  useEffect(() => {
    if (initialContent) {
      try {
        setValue(deserialize(initialContent))
      } catch (error) {
        console.error('解析笔记内容失败:', error)
        setValue(initialValue)
      }
      setMarkdownValue(initialContent)
    }
  }, [initialContent])

  // 更新 Markdown 预览
  const updateMarkdown = useCallback(() => {
    const markdown = serialize(value)
    setMarkdownValue(markdown)
  }, [value])

  // 保存笔记
  const saveNote = useCallback(async () => {
    if (!noteId) {
      toast.error('笔记ID无效')
      return
    }
    
    setLoading(true)
    updateMarkdown()
    const markdown = serialize(value)
    
    try {
      await put(`/notes/${noteId}`, {
        content: markdown
      })
      
      toast.success('笔记已保存')
    } catch (error) {
      console.error('保存笔记失败:', error)
      toast.error('保存笔记失败')
    } finally {
      setLoading(false)
    }
  }, [value, updateMarkdown, noteId])

  // 切换 Markdown 预览
  const toggleMarkdownView = useCallback(() => {
    updateMarkdown()
    setShowMarkdown(!showMarkdown)
  }, [showMarkdown, updateMarkdown])

  return (
    <div className="flex flex-col space-y-4">
      <div className="border rounded-lg overflow-hidden">
        {showMarkdown ? (
          <div className="p-4 min-h-[400px] font-mono whitespace-pre-wrap bg-muted/10">
            {markdownValue || '暂无内容'}
          </div>
        ) : (
          <Slate
            editor={editor}
            initialValue={value}
            onChange={newValue => setValue(newValue)}
          >
            <div className="bg-muted/30 p-2 border-b flex flex-wrap gap-1">
              <div className="ml-auto flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleMarkdownView}
                  className="flex items-center gap-1"
                >
                  <FileText className="h-4 w-4" />
                  {showMarkdown ? '编辑模式' : 'Markdown'}
                </Button>
                
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={saveNote}
                  disabled={loading}
                  className="flex items-center gap-1"
                >
                  <Save className="h-4 w-4" />
                  {loading ? '保存中...' : '保存'}
                </Button>
              </div>
            </div>
            <Editable
              className="p-4 min-h-[400px] focus:outline-none"
              renderElement={Element}
              renderLeaf={Leaf}
              placeholder="开始输入 Markdown 内容..."
              spellCheck={false}
              autoFocus
            />
          </Slate>
        )}
      </div>
    </div>
  )
}

export default MarkdownEditorSimple 