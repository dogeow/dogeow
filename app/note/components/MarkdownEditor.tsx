"use client"

import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { createEditor, Descendant, Editor, Transforms, Element as SlateElement, Text, Range, BaseEditor, Point, Node } from 'slate'
import { Slate, Editable, withReact, useSlate, ReactEditor } from 'slate-react'
import { withHistory, HistoryEditor } from 'slate-history'
import isHotkey from 'is-hotkey'
import { Button } from "@/components/ui/button"
import { Bold, Italic, Code, List, ListOrdered, FileText, Save, Plus, Trash, Link, Table, Square } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import useSWR, { mutate } from 'swr'
import { get, post, put, del } from '@/utils/api'

// 定义自定义元素类型
type CustomElement = {
  type: 'paragraph' | 'heading-one' | 'heading-two' | 'heading-three' | 
        'bulleted-list' | 'numbered-list' | 'list-item' | 'block-quote' |
        'code-block' | 'table' | 'table-row' | 'table-cell';
  children: CustomText[] | CustomElement[];
  url?: string;
  language?: string;
}

// 定义自定义文本类型
type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  link?: boolean;
  url?: string;
}

// 笔记类型
type Note = {
  id: number;
  title: string;
  content: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

// 声明 Slate 编辑器元素类型
declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor
    Element: CustomElement
    Text: CustomText
  }
}

// 使 Descendant 类型明确为我们自定义的类型之一
type CustomDescendant = CustomElement | CustomText

// 热键定义
const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+`': 'code',
  'mod+k': 'link',
}

// 定义列表类型
const LIST_TYPES = ['numbered-list', 'bulleted-list']

// 定义块级元素类型
const BLOCK_TYPES = ['paragraph', 'heading-one', 'heading-two', 'heading-three', 'block-quote', 'code-block']

// 初始编辑器值
const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [
      { text: '欢迎使用 Markdown 编辑器！' },
    ],
  },
  {
    type: 'paragraph',
    children: [
      { text: '这是一个基于 Slate.js 构建的编辑器，支持基本的 Markdown 语法。' },
    ],
  },
  {
    type: 'heading-one',
    children: [
      { text: '标题示例' },
    ],
  },
  {
    type: 'paragraph',
    children: [
      { text: '你可以使用 ' },
      { text: '粗体', bold: true },
      { text: '、' },
      { text: '斜体', italic: true },
      { text: ' 和 ' },
      { text: '代码', code: true },
      { text: ' 格式。' },
    ],
  },
  {
    type: 'paragraph',
    children: [
      { text: '列表:' },
    ],
  },
  {
    type: 'paragraph',
    children: [
      { text: '- 列表项 1' },
    ],
  },
  {
    type: 'paragraph',
    children: [
      { text: '- 列表项 2' },
    ],
  },
  {
    type: 'paragraph',
    children: [
      { text: '开始编辑吧！' },
    ],
  },
]

// 将字符串解析为 Slate 编辑器格式的函数（简化版）
const deserialize = (markdownString: string): Descendant[] => {
  // 如果为空，返回默认初始值
  if (!markdownString.trim()) {
    return initialValue
  }
  
  // 简单的解析，将文本按行分割处理
  const lines = markdownString.split('\n')
  const nodes: Descendant[] = []
  
  let currentList: CustomElement | null = null
  let inCodeBlock = false
  let codeBlockContent = ''
  let codeBlockLanguage = ''
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // 处理代码块开始和结束
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        // 开始代码块
        inCodeBlock = true
        codeBlockLanguage = line.substring(3).trim()
        codeBlockContent = ''
      } else {
        // 结束代码块
        inCodeBlock = false
        nodes.push({
          type: 'code-block',
          language: codeBlockLanguage,
          children: [{ text: codeBlockContent }]
        } as CustomElement)
      }
      continue
    }
    
    // 在代码块内部，收集内容
    if (inCodeBlock) {
      codeBlockContent += line + '\n'
      continue
    }
    
    // 跳过空行
    if (!line && i < lines.length - 1) continue
    
    // 处理标题
    if (line.startsWith('# ')) {
      nodes.push({
        type: 'heading-one',
        children: [{ text: line.substring(2) }]
      } as CustomElement)
      continue
    }
    
    if (line.startsWith('## ')) {
      nodes.push({
        type: 'heading-two',
        children: [{ text: line.substring(3) }]
      } as CustomElement)
      continue
    }
    
    if (line.startsWith('### ')) {
      nodes.push({
        type: 'heading-three',
        children: [{ text: line.substring(4) }]
      } as CustomElement)
      continue
    }
    
    // 处理列表
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const listItem = {
        type: 'list-item',
        children: [{ text: line.substring(2) }]
      } as CustomElement
      
      if (!currentList || currentList.type !== 'bulleted-list') {
        currentList = {
          type: 'bulleted-list',
          children: [listItem]
        } as CustomElement
        nodes.push(currentList)
      } else {
        (currentList.children as CustomElement[]).push(listItem)
      }
      continue
    }
    
    // 处理引用
    if (line.startsWith('> ')) {
      nodes.push({
        type: 'block-quote',
        children: [{ text: line.substring(2) }]
      } as CustomElement)
      continue
    }
    
    // 普通段落（可能包含链接）
    if (line || i === lines.length - 1) {
      // 简单处理链接 [text](url)
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
      const textParts = []
      let lastIndex = 0
      let match
      
      while ((match = linkRegex.exec(line)) !== null) {
        // 添加链接前的普通文本
        if (match.index > lastIndex) {
          textParts.push({ text: line.substring(lastIndex, match.index) })
        }
        
        // 添加链接
        textParts.push({ 
          text: match[1],
          link: true,
          url: match[2]
        } as CustomText)
        
        lastIndex = match.index + match[0].length
      }
      
      // 添加剩余文本
      if (lastIndex < line.length) {
        textParts.push({ text: line.substring(lastIndex) })
      }
      
      // 如果没有找到链接，添加整行文本
      if (textParts.length === 0) {
        textParts.push({ text: line })
      }
      
      nodes.push({
        type: 'paragraph',
        children: textParts
      } as CustomElement)
      continue
    }
  }
  
  // 如果代码块未关闭，添加它
  if (inCodeBlock) {
    nodes.push({
      type: 'code-block',
      language: codeBlockLanguage,
      children: [{ text: codeBlockContent }]
    } as CustomElement)
  }
  
  return nodes.length ? nodes : initialValue
}

// 序列化为 Markdown
const serialize = (nodes: Descendant[]): string => {
  return nodes.map(node => {
    if (Text.isText(node)) {
      let text = node.text
      
      if (node.link && node.url) {
        text = `[${text}](${node.url})`
      }
      if (node.bold) {
        text = `**${text}**`
      }
      if (node.italic) {
        text = `*${text}*`
      }
      if (node.code) {
        text = `\`${text}\``
      }
      return text
    }

    if (!('type' in node)) return ''
    
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
      case 'bulleted-list':
        return children
      case 'numbered-list':
        return children
      case 'list-item':
        return `- ${children}\n`
      case 'block-quote':
        return `> ${children}\n\n`
      case 'code-block':
        const language = 'language' in node ? node.language || '' : ''
        return `\`\`\`${language}\n${children}\n\`\`\`\n\n`
      case 'table':
        return `${children}\n`
      case 'table-row':
        return `${children}|\n`
      case 'table-cell':
        return `|${children}`
      default:
        return children
    }
  }).join('')
}

// 自定义元素渲染
const Element = ({ attributes, children, element }: any) => {
  switch (element.type) {
    case 'block-quote':
      return <blockquote {...attributes} className="border-l-4 border-gray-300 pl-4 italic my-4">{children}</blockquote>
    case 'bulleted-list':
      return <ul {...attributes} className="list-disc pl-5 my-4">{children}</ul>
    case 'heading-one':
      return <h1 {...attributes} className="text-3xl font-bold my-4">{children}</h1>
    case 'heading-two':
      return <h2 {...attributes} className="text-2xl font-bold my-3">{children}</h2>
    case 'heading-three':
      return <h3 {...attributes} className="text-xl font-bold my-2">{children}</h3>
    case 'list-item':
      return <li {...attributes}>{children}</li>
    case 'numbered-list':
      return <ol {...attributes} className="list-decimal pl-5 my-4">{children}</ol>
    case 'code-block':
      return (
        <div {...attributes} className="my-4">
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            <code className="text-sm font-mono">
              {children}
            </code>
          </pre>
        </div>
      )
    case 'table':
      return (
        <table {...attributes} className="border-collapse border border-gray-300 my-4 w-full">
          <tbody>{children}</tbody>
        </table>
      )
    case 'table-row':
      return <tr {...attributes} className="border-b border-gray-300">{children}</tr>
    case 'table-cell':
      return <td {...attributes} className="border border-gray-300 p-2">{children}</td>
    default:
      return <p {...attributes} className="my-2">{children}</p>
  }
}

// 自定义文本渲染
const Leaf = ({ attributes, children, leaf }: any) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>
  }

  if (leaf.italic) {
    children = <em>{children}</em>
  }

  if (leaf.code) {
    children = <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">{children}</code>
  }
  
  if (leaf.link && leaf.url) {
    children = <a href={leaf.url} className="text-blue-500 hover:underline">{children}</a>
  }

  return <span {...attributes}>{children}</span>
}

// 工具栏按钮
const ToolbarButton = ({ format, icon: Icon, tooltip, editor }: { 
  format: string; 
  icon: any; 
  tooltip: string; 
  editor: Editor 
}) => {
  const isBlockActive = (editor: Editor, format: string) => {
    const [match] = Editor.nodes(editor, {
      match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
    })
    return !!match
  }

  const isMarkActive = (editor: Editor, format: string) => {
    const marks = Editor.marks(editor)
    return marks ? marks[format as keyof Omit<CustomText, 'text'>] === true : false
  }

  const toggleBlock = (editor: Editor, format: string) => {
    const isActive = isBlockActive(editor, format)
    const isList = LIST_TYPES.includes(format)

    Transforms.unwrapNodes(editor, {
      match: n =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        LIST_TYPES.includes(n.type as string),
      split: true,
    })

    const newProperties: Partial<CustomElement> = {
      type: isActive 
        ? 'paragraph' 
        : isList 
          ? 'list-item' 
          : format as CustomElement['type'],
    }
    
    Transforms.setNodes(editor, newProperties)

    if (!isActive && isList) {
      const block: CustomElement = { 
        type: format as 'bulleted-list' | 'numbered-list', 
        children: [] 
      }
      Transforms.wrapNodes(editor, block)
    }
  }

  const toggleMark = (editor: Editor, format: string) => {
    const isActive = isMarkActive(editor, format)
    if (isActive) {
      Editor.removeMark(editor, format)
    } else {
      Editor.addMark(editor, format, true)
    }
  }

  const isActive = format === 'bulleted-list' || format === 'numbered-list'
    ? isBlockActive(editor, format)
    : isMarkActive(editor, format)

  return (
    <Button
      type="button"
      variant={isActive ? "default" : "ghost"} 
      size="icon"
      onClick={() => {
        if (['bold', 'italic', 'code'].includes(format)) {
          toggleMark(editor, format)
        } else {
          toggleBlock(editor, format) 
        }
      }}
      title={tooltip}
      className="h-9 w-9"
    >
      <Icon className="h-5 w-5" />
    </Button>
  )
}

// 处理快捷键输入
const withShortcuts = (editor: Editor) => {
  const { deleteBackward, insertText } = editor

  editor.insertText = (text) => {
    const { selection } = editor

    if (text === ' ' && selection && Range.isCollapsed(selection)) {
      const { anchor } = selection
      const block = Editor.above(editor, {
        match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
      })
      const path = block ? block[1] : []
      const start = Editor.start(editor, path)
      const range = { anchor, focus: start }
      const beforeText = Editor.string(editor, range)

      // 处理标题语法
      if (beforeText === '#') {
        Transforms.select(editor, range)
        Transforms.delete(editor)
        Transforms.setNodes(
          editor,
          { type: 'heading-one' },
          { match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) }
        )
        return
      }

      if (beforeText === '##') {
        Transforms.select(editor, range)
        Transforms.delete(editor)
        Transforms.setNodes(
          editor,
          { type: 'heading-two' },
          { match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) }
        )
        return
      }

      if (beforeText === '###') {
        Transforms.select(editor, range)
        Transforms.delete(editor)
        Transforms.setNodes(
          editor,
          { type: 'heading-three' },
          { match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) }
        )
        return
      }

      // 处理列表语法
      if (beforeText === '-' || beforeText === '*') {
        Transforms.select(editor, range)
        Transforms.delete(editor)
        
        Transforms.setNodes(
          editor,
          { type: 'list-item' },
          { match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) }
        )
        
        Transforms.wrapNodes(
          editor,
          { type: 'bulleted-list', children: [] },
          { match: n => SlateElement.isElement(n) && n.type === 'list-item' }
        )
        return
      }

      // 处理引用
      if (beforeText === '>') {
        Transforms.select(editor, range)
        Transforms.delete(editor)
        Transforms.setNodes(
          editor,
          { type: 'block-quote' },
          { match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) }
        )
        return
      }

      // 处理代码块
      if (beforeText === '```') {
        Transforms.select(editor, range)
        Transforms.delete(editor)
        Transforms.setNodes(
          editor,
          { type: 'code-block', language: '' },
          { match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) }
        )
        return
      }
    }

    insertText(text)
  }

  editor.deleteBackward = (...args) => {
    const { selection } = editor

    if (selection && Range.isCollapsed(selection)) {
      const match = Editor.above(editor, {
        match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
      })

      if (match) {
        const [block, path] = match
        const start = Editor.start(editor, path)
        
        if (
          SlateElement.isElement(block) && 
          block.type !== 'paragraph' &&
          Point.equals(selection.anchor, start)
        ) {
          Transforms.setNodes(editor, { type: 'paragraph' })
          return
        }
      }
    }

    deleteBackward(...args)
  }

  return editor
}

// 主编辑器组件
interface MarkdownEditorProps {
  noteId: number;
  initialContent?: string;
}

const MarkdownEditor = ({ noteId, initialContent }: MarkdownEditorProps) => {
  const [value, setValue] = useState<Descendant[]>(initialValue)
  const [markdownValue, setMarkdownValue] = useState(initialContent || '')
  const [showMarkdown, setShowMarkdown] = useState(false)
  const [currentNoteId, setCurrentNoteId] = useState<number | null>(noteId)
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
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

  // 处理编辑器的键盘快捷键
  const handleKeyDown = (event: React.KeyboardEvent) => {
    for (const hotkey in HOTKEYS) {
      if (isHotkey(hotkey, event)) {
        event.preventDefault()
        const mark = HOTKEYS[hotkey as keyof typeof HOTKEYS]
        
        // 特殊处理链接快捷键
        if (mark === 'link') {
          // 获取选中的文本作为默认链接文本
          const selection = editor.selection
          if (selection && !Range.isCollapsed(selection)) {
            const fragment = Editor.fragment(editor, selection)
            if (fragment.length > 0) {
              const firstNode = fragment[0]
              if (Text.isText(firstNode)) {
                setLinkText(firstNode.text)
              }
            }
          }
          setIsLinkDialogOpen(true)
          return
        }
        
        editor.addMark(mark, true)
      }
    }
  }

  // 更新 Markdown 预览
  const updateMarkdown = useCallback(() => {
    const markdown = serialize(value)
    setMarkdownValue(markdown)
  }, [value])

  // 保存笔记
  const saveNote = useCallback(async () => {
    if (!currentNoteId) {
      toast.error('笔记ID无效')
      return
    }
    
    setLoading(true)
    updateMarkdown()
    const markdown = serialize(value)
    
    try {
      await put(`/notes/${currentNoteId}`, {
        content: markdown
      })
      
      toast.success('笔记已保存')
    } catch (error) {
      console.error('保存笔记失败:', error)
      toast.error('保存笔记失败')
    } finally {
      setLoading(false)
    }
  }, [value, updateMarkdown, currentNoteId])

  // 切换 Markdown 预览
  const toggleMarkdownView = useCallback(() => {
    updateMarkdown()
    setShowMarkdown(!showMarkdown)
  }, [showMarkdown, updateMarkdown])

  // 插入链接
  const insertLink = useCallback(() => {
    if (!linkUrl.trim()) return
    
    // 获取当前选中的文本
    const text = linkText || '链接'
    
    // 创建链接节点
    const linkNode = {
      text,
      link: true,
      url: linkUrl
    }
    
    // 插入到编辑器
    editor.insertNodes(linkNode)
    
    // 重置状态
    setLinkUrl('')
    setLinkText('')
    setIsLinkDialogOpen(false)
  }, [editor, linkUrl, linkText])

  // 插入代码块
  const insertCodeBlock = useCallback(() => {
    // 创建代码块
    const codeBlockNode: CustomElement = {
      type: 'code-block',
      language: '',
      children: [{ text: '' }]
    }
    
    // 插入到编辑器
    Transforms.insertNodes(editor, codeBlockNode)
    
    // 将光标移至代码块内
    Transforms.move(editor)
  }, [editor])

  // 插入表格
  const insertTable = useCallback(() => {
    const tableNode: CustomElement = {
      type: 'table',
      children: [
        {
          type: 'table-row',
          children: [
            { type: 'table-cell', children: [{ text: '列1' }] },
            { type: 'table-cell', children: [{ text: '列2' }] }
          ]
        } as CustomElement,
        {
          type: 'table-row',
          children: [
            { type: 'table-cell', children: [{ text: '' }] },
            { type: 'table-cell', children: [{ text: '' }] }
          ]
        } as CustomElement
      ]
    }
    
    // 插入到编辑器
    Transforms.insertNodes(editor, tableNode)
  }, [editor])

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
              <ToolbarButton format="bold" icon={Bold} tooltip="粗体 (Ctrl+B)" editor={editor} />
              <ToolbarButton format="italic" icon={Italic} tooltip="斜体 (Ctrl+I)" editor={editor} />
              <ToolbarButton format="code" icon={Code} tooltip="代码 (Ctrl+`)" editor={editor} />
              <div className="w-px h-8 bg-border mx-1"></div>
              
              <ToolbarButton format="bulleted-list" icon={List} tooltip="无序列表" editor={editor} />
              <ToolbarButton format="numbered-list" icon={ListOrdered} tooltip="有序列表" editor={editor} />
              <div className="w-px h-8 bg-border mx-1"></div>
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsLinkDialogOpen(true)}
                title="插入链接 (Ctrl+K)"
                className="h-9 w-9"
              >
                <Link className="h-5 w-5" />
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={insertCodeBlock}
                title="插入代码块"
                className="h-9 w-9"
              >
                <Square className="h-5 w-5" />
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={insertTable}
                title="插入表格"
                className="h-9 w-9"
              >
                <Table className="h-5 w-5" />
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
                  disabled={loading || !currentNoteId}
                  className="flex items-center gap-1"
                >
                  <Save className="h-4 w-4" />
                  {loading ? '保存中...' : '保存'}
                </Button>
              </div>
            </div>
            <Editable
              className="p-4 min-h-[400px] focus:outline-none"
              renderElement={props => <Element {...props} />}
              renderLeaf={props => <Leaf {...props} />}
              placeholder="开始输入 Markdown 内容..."
              spellCheck={false}
              autoFocus
              onKeyDown={handleKeyDown}
            />
          </Slate>
        )}
      </div>
      
      {/* 添加链接对话框 */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>插入链接</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">链接文本</label>
              <Input
                placeholder="显示文本"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">URL</label>
              <Input
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsLinkDialogOpen(false)}
            >
              取消
            </Button>
            <Button 
              onClick={insertLink}
              disabled={!linkUrl.trim()}
            >
              插入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MarkdownEditor 