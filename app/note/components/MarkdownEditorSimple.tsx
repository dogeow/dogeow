"use client"

import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { createEditor, Descendant, Text, Element as SlateElement } from 'slate'
import { Slate, Editable, withReact, ReactEditor } from 'slate-react'
import { withHistory } from 'slate-history'
import { Button } from "@/components/ui/button"
import { Save, FileText, Bold, Italic, List, ListOrdered, Code, Link as LinkIcon } from 'lucide-react'
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
      // 检查是否是文本节点
      if (Text.isText(node)) {
        return node.text
      }
      
      // 处理元素节点
      if (SlateElement.isElement(node)) {
        const children = node.children.map(n => serialize([n])).join('')
        
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
      }
      
      return ''
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
      return <li {...attributes} className="editor-list-item">{children}</li>
    default:
      return <p {...attributes} className="editor-paragraph">{children}</p>
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

// 添加快捷键处理的编辑器增强
const withShortcuts = (editor: any) => {
  const { insertText, deleteBackward } = editor
  
  editor.insertText = (text: string) => {
    // 获取当前选区
    const { selection } = editor
    
    // 如果输入空格，且有有效选区
    if (text === ' ' && selection && selection.anchor.offset === 1) {
      // 获取当前行的内容
      const startOfLine = { ...selection.anchor, offset: 0 }
      const beforeText = editor.string({ anchor: startOfLine, focus: selection.focus })
      
      // 检查是否是特定的Markdown标记
      if (beforeText === '-' || beforeText === '*') {
        // 删除标记
        editor.delete({ unit: 'character', reverse: true })
        // 创建列表项
        const listItem = {
          type: 'list-item',
          children: [{ text: '' }]
        }
        // 插入列表项
        editor.insertNode(listItem)
        return
      }
      
      // 处理标题
      if (beforeText === '#') {
        editor.delete({ unit: 'character', reverse: true })
        editor.insertNode({
          type: 'heading-one',
          children: [{ text: '' }]
        })
        return
      }
      
      if (beforeText === '##') {
        editor.delete({ unit: 'character', reverse: true })
        editor.delete({ unit: 'character', reverse: true })
        editor.insertNode({
          type: 'heading-two',
          children: [{ text: '' }]
        })
        return
      }
      
      if (beforeText === '###') {
        editor.delete({ unit: 'character', reverse: true })
        editor.delete({ unit: 'character', reverse: true })
        editor.delete({ unit: 'character', reverse: true })
        editor.insertNode({
          type: 'heading-three',
          children: [{ text: '' }]
        })
        return
      }
    }
    
    // 默认行为
    insertText(text)
  }
  
  editor.deleteBackward = (...args: any[]) => {
    const { selection } = editor
    
    // 处理特殊块的删除逻辑
    if (selection && selection.anchor.offset === 0) {
      const currentNode = editor.above()
      
      if (currentNode) {
        const [node, path] = currentNode
        
        // 如果当前不是普通段落，且在行首，则转换为普通段落
        if (node.type !== 'paragraph' && selection.anchor.offset === 0) {
          editor.setNodes({ type: 'paragraph' })
          return
        }
      }
    }
    
    // 默认行为
    deleteBackward(...args)
  }
  
  return editor
}

// 自定义Placeholder组件
const Placeholder = ({ children, attributes }: { children: React.ReactNode; attributes?: any }) => {
  return (
    <div
      {...attributes}
      className="absolute top-[16px] left-[16px] opacity-50 pointer-events-none select-none"
    >
      {children}
    </div>
  );
};

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
  
  const editor = useMemo(() => withShortcuts(withHistory(withReact(createEditor()))), [])

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

  // 添加格式化功能
  const toggleBold = useCallback(() => {
    // @ts-ignore - 简化实现
    const selection = editor.selection
    if (selection) {
      // @ts-ignore - 简化实现
      const marks = editor.marks || {}
      // @ts-ignore - 简化实现
      editor.addMark('bold', !marks.bold)
    }
  }, [editor])
  
  const toggleItalic = useCallback(() => {
    // @ts-ignore - 简化实现
    const selection = editor.selection
    if (selection) {
      // @ts-ignore - 简化实现
      const marks = editor.marks || {}
      // @ts-ignore - 简化实现
      editor.addMark('italic', !marks.italic)
    }
  }, [editor])
  
  const toggleCode = useCallback(() => {
    // @ts-ignore - 简化实现
    const selection = editor.selection
    if (selection) {
      // @ts-ignore - 简化实现
      const marks = editor.marks || {}
      // @ts-ignore - 简化实现
      editor.addMark('code', !marks.code)
    }
  }, [editor])
  
  const insertList = useCallback((listType: 'bulleted' | 'numbered') => {
    // @ts-ignore - 简化实现
    const selection = editor.selection
    if (selection) {
      // 简单插入一个列表项
      const listItem = {
        type: 'list-item',
        children: [{ text: '' }]
      }
      // @ts-ignore - 简化实现
      editor.insertNodes(listItem)
    }
  }, [editor])
  
  const insertLink = useCallback(() => {
    const url = prompt('输入链接URL:')
    if (url) {
      const text = prompt('输入链接文本:', url)
      // @ts-ignore - 简化实现
      editor.insertText(`[${text || url}](${url})`)
    }
  }, [editor])

  return (
    <div className="flex flex-col space-y-4">
      <div className="border rounded-lg overflow-hidden">
        {showMarkdown ? (
          <div className="p-4 min-h-[400px] font-mono whitespace-pre-wrap bg-muted/10 slate-editor-container">
            {markdownValue || '暂无内容'}
          </div>
        ) : (
          <Slate
            editor={editor}
            initialValue={value}
            onChange={newValue => setValue(newValue)}
          >
            <div className="bg-muted/30 p-2 border-b flex flex-wrap gap-1">
              <Button 
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleBold}
                title="加粗"
                className="h-9 w-9"
              >
                <Bold className="h-5 w-5" />
              </Button>
              
              <Button 
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleItalic}
                title="斜体"
                className="h-9 w-9"
              >
                <Italic className="h-5 w-5" />
              </Button>
              
              <Button 
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleCode}
                title="代码"
                className="h-9 w-9"
              >
                <Code className="h-5 w-5" />
              </Button>
              
              <div className="w-px h-8 bg-border mx-1"></div>
              
              <Button 
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => insertList('bulleted')}
                title="无序列表"
                className="h-9 w-9"
              >
                <List className="h-5 w-5" />
              </Button>
              
              <Button 
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => insertList('numbered')}
                title="有序列表"
                className="h-9 w-9"
              >
                <ListOrdered className="h-5 w-5" />
              </Button>
              
              <div className="w-px h-8 bg-border mx-1"></div>
              
              <Button 
                type="button"
                variant="ghost"
                size="icon"
                onClick={insertLink}
                title="插入链接"
                className="h-9 w-9"
              >
                <LinkIcon className="h-5 w-5" />
              </Button>

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
            <div className="relative slate-editor-container">
              <Editable
                className="min-h-[400px] focus:outline-none w-full"
                renderElement={Element}
                renderLeaf={Leaf}
                spellCheck={false}
                autoFocus
                placeholder=""
                onDOMBeforeInput={(event) => {
                  // 防止浏览器默认行为导致光标位置异常
                  const target = event.target as HTMLElement
                  if (event.inputType === 'insertParagraph' && !target.textContent) {
                    event.preventDefault()
                    // @ts-ignore
                    editor.insertText('\n')
                  }
                }}
              />
              {/* 使用类型断言处理类型错误，检查是否显示占位符 */}
              {value.length > 0 && 
               // @ts-ignore - 简化实现
               (value[0].children?.[0]?.text === '' || value[0].children?.[0]?.text === undefined) && (
                <div className="absolute top-4 left-0 opacity-50 pointer-events-none pl-4">
                  开始输入 Markdown 内容...
                </div>
              )}
            </div>
          </Slate>
        )}
      </div>
    </div>
  )
}

export default MarkdownEditorSimple 