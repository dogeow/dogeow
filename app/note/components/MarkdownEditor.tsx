"use client"

import { useState, useCallback } from 'react'
import { createEditor, Descendant, Element as SlateElement, Transforms, Editor, Text, BaseEditor, Node, Range as SlateRange } from 'slate'
import { Slate, Editable, withReact, ReactEditor, RenderElementProps, RenderLeafProps } from 'slate-react'
import { withHistory, HistoryEditor } from 'slate-history'
import { Button } from "@/components/ui/button"
import { Bold, Italic, List, ListOrdered, Code, Save, Quote, Heading1, Heading2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { put } from '@/utils/api'

interface MarkdownEditorProps {
  noteId: number
  initialContent?: string
}

// 定义元素类型
type ElementType = 
  | 'paragraph' 
  | 'heading-one' 
  | 'heading-two' 
  | 'block-quote' 
  | 'bulleted-list' 
  | 'numbered-list' 
  | 'list-item' 
  | 'code-block'

// 自定义SlateElement类型
interface CustomElement {
  type: ElementType
  language?: string
  children: CustomText[]
}

// 自定义Text类型
interface CustomText {
  text: string
  bold?: boolean
  italic?: boolean
  code?: boolean
  [key: string]: any
}

// 节点条目类型
type NodeEntry = [Node, number[]]

// 范围类型
interface TokenRange extends SlateRange {
  token: boolean
  [key: string]: any
}

// 创建扩展编辑器类型
type ExtendedEditor = BaseEditor & ReactEditor & HistoryEditor & {
  nodeToDecorations?: Map<Element, TokenRange[]>
}

// 初始内容
const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: '在下面可以看到PHP代码高亮效果示例：' }],
  },
  {
    type: 'code-block',
    language: 'php',
    children: [
      { 
        text: `<?php
        echo "Hello, World!";
        `
      }
    ],
  },
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
]

// 把纯文本转换为Slate格式
const deserializeContent = (content: string): Descendant[] => {
  if (!content) return initialValue

  // 简单的转换，实际项目中可能需要更复杂的解析
  try {
    return JSON.parse(content)
  } catch (error) {
    // 如果不是JSON，就把它当作普通文本处理
    return [
      {
        type: 'paragraph',
        children: [{ text: content }],
      },
    ]
  }
}

// 序列化Slate内容为JSON字符串
const serializeContent = (value: Descendant[]): string => {
  return JSON.stringify(value)
}

// 自定义扩展编辑器，添加处理Markdown快捷方式功能
const withMarkdownShortcuts = (editor: ExtendedEditor) => {
  const { insertText } = editor

  editor.insertText = (text) => {
    const { selection } = editor

    if (text === ' ' && selection && SlateRange.isCollapsed(selection)) {
      const { anchor } = selection
      const block = Editor.above(editor, {
        match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
      })
      const path = block ? block[1] : []
      const start = Editor.start(editor, path)
      const range = { anchor, focus: start }
      const beforeText = Editor.string(editor, range)

      // 处理Markdown快捷方式
      const beforeMatch = checkMarkdownShortcut(beforeText)
      if (beforeMatch) {
        // 删除Markdown标记文本
        Transforms.select(editor, range)
        Transforms.delete(editor)

        // 根据Markdown标记应用格式
        const type = beforeMatch[1] // 提取匹配的类型，如 #, ##, >, -, *, + 等
        const languageMatch = type === '```' && beforeMatch[2] // 如果是代码块，提取语言
        
        switch (type) {
          case '#':
            Transforms.setNodes(
              editor,
              { type: 'heading-one' },
              { match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) }
            )
            break
          case '##':
            Transforms.setNodes(
              editor,
              { type: 'heading-two' },
              { match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) }
            )
            break
          case '>':
            Transforms.setNodes(
              editor,
              { type: 'block-quote' },
              { match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) }
            )
            break
          case '-':
          case '*':
          case '+':
            // 设置当前节点为列表项
            Transforms.setNodes(
              editor,
              { type: 'list-item' },
              { match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) }
            )
            // 包裹在无序列表中
            Transforms.wrapNodes(
              editor,
              { type: 'bulleted-list', children: [] },
              { match: n => SlateElement.isElement(n) && (n as CustomElement).type === 'list-item' }
            )
            break
          case '1.':
            // 设置当前节点为列表项
            Transforms.setNodes(
              editor,
              { type: 'list-item' },
              { match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) }
            )
            // 包裹在有序列表中
            Transforms.wrapNodes(
              editor,
              { type: 'numbered-list', children: [] },
              { match: n => SlateElement.isElement(n) && (n as CustomElement).type === 'list-item' }
            )
            break
          case '```':
            // 插入代码块
            Transforms.setNodes(
              editor,
              { type: 'code-block', language: languageMatch || 'text' },
              { match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) }
            )
            break
        }
        return
      }
    }

    // 如果没有匹配Markdown语法，执行默认插入文本操作
    insertText(text)
  }

  return editor
}

// 检查Markdown快捷方式
const checkMarkdownShortcut = (text: string) => {
  return (
    // 标题、引用和列表标记的正则
    /^(\#\#|\#|\>|\-|\*|\+|1\.|```(\w+)?)$/.exec(text)
  )
}

// 检查行内的Markdown格式化快捷方式
const checkInlineFormat = (text: string) => {
  // 检查行内加粗、斜体、代码格式
  if (text.endsWith('**') && text.startsWith('**') && text.length > 4) {
    return { format: 'bold', text: text.slice(2, -2) };
  }
  if (text.endsWith('*') && text.startsWith('*') && text.length > 2) {
    return { format: 'italic', text: text.slice(1, -1) };
  }
  if (text.endsWith('`') && text.startsWith('`') && text.length > 2) {
    return { format: 'code', text: text.slice(1, -1) };
  }
  return null;
}

// 装饰函数，用于代码高亮
const useDecorate = (editor: ExtendedEditor) => {
  return useCallback(
    ([node, path]: NodeEntry) => {
      if (SlateElement.isElement(node)) {
        // 使用类型断言获取节点装饰
        const ranges = editor.nodeToDecorations?.get(node as unknown as Element) || []
        return ranges
      }
      return []
    },
    [editor.nodeToDecorations]
  )
}

const MarkdownEditor = ({ noteId, initialContent = '' }: MarkdownEditorProps) => {
  // 创建编辑器
  const [editor] = useState(() => 
    withMarkdownShortcuts(
      withHistory(withReact(createEditor()))
    ) as ExtendedEditor
  )
  const [value, setValue] = useState<Descendant[]>(() => 
    initialContent ? deserializeContent(initialContent) : initialValue
  )
  const [loading, setLoading] = useState(false)
  
  // 装饰函数
  const decorate = useDecorate(editor)

  // 保存笔记
  const saveNote = useCallback(async () => {
    if (!noteId) {
      toast.error('笔记ID无效')
      return
    }
    
    setLoading(true)
    
    try {
      await put(`/notes/${noteId}`, {
        content: serializeContent(value)
      })
      
      toast.success('笔记已保存')
    } catch (error) {
      console.error('保存笔记失败:', error)
      toast.error('保存笔记失败')
    } finally {
      setLoading(false)
    }
  }, [value, noteId])


  // 自定义元素渲染
  const renderElement = useCallback((props: RenderElementProps) => {
    const { attributes, children, element } = props

    switch (element.type) {
      case 'heading-one':
        return <h1 {...attributes} className="text-2xl font-bold my-3">{children}</h1>
      case 'heading-two':
        return <h2 {...attributes} className="text-xl font-bold my-2">{children}</h2>
      case 'block-quote':
        return <blockquote {...attributes} className="border-l-4 border-gray-300 pl-4 py-1 italic">{children}</blockquote>
      case 'bulleted-list':
        return <ul {...attributes} className="list-disc ml-5">{children}</ul>
      case 'numbered-list':
        return <ol {...attributes} className="list-decimal ml-5">{children}</ol>
      case 'list-item':
        return <li {...attributes}>{children}</li>
      default:
        return <p {...attributes} className="my-2">{children}</p>
    }
  }, [])

  // 自定义叶子渲染
  const renderLeaf = useCallback((props: RenderLeafProps) => {
    const { attributes, children, leaf } = props
    const { text, ...rest } = leaf as CustomText & { [key: string]: any }
    
    let className = ''
    
    // 使用React.createElement避免直接修改children
    let element = <>{children}</>
    
    // 处理基本格式
    if (rest.bold) {
      element = <strong>{element}</strong>
    }
    
    if (rest.italic) {
      element = <em>{element}</em>
    }
    
    if (rest.code) {
      element = <code className="bg-gray-100 dark:bg-gray-800 rounded px-1">{element}</code>
    }
    
    return (
      <span 
        {...attributes} 
        className={className ? className : undefined}
      >
        {element}
      </span>
    )
  }, [])

  // 格式按钮点击
  const handleFormatClick = (format: string) => {
    switch (format) {
      case 'bold':
      case 'italic':
      case 'code':
        toggleMark(format)
        break
      case 'heading-one':
      case 'heading-two':
      case 'block-quote':
      case 'bulleted-list':
      case 'numbered-list':
        toggleBlock(format as ElementType)
        break
      default:
        break
    }
  }

  // 切换标记
  const toggleMark = (format: string) => {
    const isActive = isMarkActive(format)

    if (isActive) {
      Editor.removeMark(editor, format)
    } else {
      Editor.addMark(editor, format, true)
    }
  }

  // 判断标记是否激活
  const isMarkActive = (format: string) => {
    const marks = Editor.marks(editor)
    return marks ? marks[format as keyof typeof marks] === true : false
  }

  // 切换块
  const toggleBlock = (format: ElementType) => {
    const isActive = isBlockActive(format)
    const isList = format === 'bulleted-list' || format === 'numbered-list'

    Transforms.unwrapNodes(editor, {
      match: n => 
        SlateElement.isElement(n) && 
        ['bulleted-list', 'numbered-list'].includes((n as CustomElement).type),
      split: true,
    })

    const newProperties: Partial<CustomElement> = {
      type: isActive ? 'paragraph' : isList ? 'list-item' : format,
    }
    
    Transforms.setNodes(editor, newProperties)

    if (!isActive && isList) {
      const block: CustomElement = { 
        type: format, 
        children: [] 
      }
      Transforms.wrapNodes(editor, block)
    }
  }

  // 判断块是否激活
  const isBlockActive = (format: ElementType) => {
    const [match] = Editor.nodes(editor, {
      match: n => 
        SlateElement.isElement(n) && 
        (n as CustomElement).type === format,
    })

    return !!match
  }

  // 自定义编辑器处理Markdown键盘事件
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    // 处理行内格式化
    if (event.key === ' ' && !event.ctrlKey && !event.metaKey) {
      const { selection } = editor;
      if (selection && SlateRange.isCollapsed(selection)) {
        const [node] = Editor.node(editor, selection.anchor.path);
        if (Text.isText(node)) {
          const blockEntry = Editor.above(editor, { match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) });
          if (blockEntry) {
            const [, blockPath] = blockEntry;
            const currentLineStart = Editor.start(editor, blockPath);
            const currentPos = selection.anchor;
            const range = { anchor: currentLineStart, focus: currentPos };
            const text = Editor.string(editor, range);
          
            // 检查是否符合行内格式化的模式
            if (text.includes('**') || text.includes('*') || text.includes('`')) {
              const inlineFormat = checkInlineFormat(text);
              if (inlineFormat) {
                event.preventDefault();
                
                // 删除带格式标记的文本
                Transforms.delete(editor, { at: range });
                
                // 插入格式化的文本
                Transforms.insertText(editor, inlineFormat.text);
                
                // 添加格式标记
                Transforms.select(editor, {
                  anchor: { path: currentPos.path, offset: currentLineStart.offset },
                  focus: { path: currentPos.path, offset: currentLineStart.offset + inlineFormat.text.length }
                });
                
                Editor.addMark(editor, inlineFormat.format, true);
                
                // 将光标移动到文本末尾
                Transforms.select(editor, {
                  anchor: { path: currentPos.path, offset: currentLineStart.offset + inlineFormat.text.length + 1 },
                  focus: { path: currentPos.path, offset: currentLineStart.offset + inlineFormat.text.length + 1 }
                });
                
                return;
              }
            }
          }
        }
      }
    }
    
    // 处理Tab键
    if (event.key === 'Tab') {
      event.preventDefault();
      
      // 插入两个空格作为缩进
      editor.insertText('  ');
      return;
    }

    // 处理回车键：继续列表
    if (event.key === 'Enter' && !event.shiftKey) {
      const [match] = Editor.nodes(editor, {
        match: n => 
          SlateElement.isElement(n) && 
          ['list-item'].includes((n as CustomElement).type),
      });

      if (match) {
        const [node, path] = match;
        
        // 检查列表项是否为空
        if (Editor.string(editor, path) === '') {
          event.preventDefault();
          
          // 如果列表项为空，取消列表格式
          Transforms.unwrapNodes(editor, {
            match: n => 
              SlateElement.isElement(n) && 
              ['bulleted-list', 'numbered-list'].includes((n as CustomElement).type),
            split: true,
          });
          
          Transforms.setNodes(editor, { type: 'paragraph' });
          return;
        }
        
        // 继续列表
        const listType = Editor.above(editor, {
          match: n => 
            SlateElement.isElement(n) && 
            ['bulleted-list', 'numbered-list'].includes((n as CustomElement).type),
        });
        
        if (listType) {
          const [listNode] = listType;
          event.preventDefault();
          
          // 在当前列表项后插入新的列表项
          Transforms.insertNodes(editor, {
            type: 'list-item',
            children: [{ text: '' }],
          });
          return;
        }
      }
      
      // 处理代码块内的回车
      const codeBlockEntry = Editor.above(editor, {
        match: n => 
          SlateElement.isElement(n) && 
          (n as CustomElement).type === 'code-block',
      });
      
      if (codeBlockEntry) {
        // 在代码块内直接插入换行符，不创建新块
        event.preventDefault();
        editor.insertText('\n');
        return;
      }
    }
  }, [editor]);

  return (
    <div className="flex flex-col space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted/30 p-2 border-b flex flex-wrap gap-1">
          <Button 
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleFormatClick('heading-one')}
            title="标题1"
            className="h-9 w-9"
          >
            <Heading1 className="h-5 w-5" />
          </Button>
          
          <Button 
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleFormatClick('heading-two')}
            title="标题2"
            className="h-9 w-9"
          >
            <Heading2 className="h-5 w-5" />
          </Button>
          
          <Button 
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleFormatClick('block-quote')}
            title="引用"
            className="h-9 w-9"
          >
            <Quote className="h-5 w-5" />
          </Button>
          
          <div className="w-px h-8 bg-border mx-1"></div>
          
          <Button 
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleFormatClick('bold')}
            title="加粗"
            className="h-9 w-9"
          >
            <Bold className="h-5 w-5" />
          </Button>
          
          <Button 
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleFormatClick('italic')}
            title="斜体"
            className="h-9 w-9"
          >
            <Italic className="h-5 w-5" />
          </Button>
          
          <Button 
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleFormatClick('code')}
            title="行内代码"
            className="h-9 w-9"
          >
            <Code className="h-5 w-5" />
          </Button>
          
          <div className="w-px h-8 bg-border mx-1"></div>
          
          <Button 
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleFormatClick('bulleted-list')}
            title="无序列表"
            className="h-9 w-9"
          >
            <List className="h-5 w-5" />
          </Button>
          
          <Button 
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleFormatClick('numbered-list')}
            title="有序列表"
            className="h-9 w-9"
          >
            <ListOrdered className="h-5 w-5" />
          </Button>
          
          <div className="w-px h-8 bg-border mx-1"></div>
          
          <div className="ml-auto flex gap-2">
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
        
        <div className="relative">
          <Slate 
            editor={editor}
            initialValue={value}
            onChange={value => setValue(value)}
          >
            <Editable
              className="min-h-[400px] p-4 outline-none text-base leading-normal"
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              onKeyDown={handleKeyDown}
              decorate={decorate}
            />
          </Slate>
        </div>
      </div>
    </div>
  )
}

export default MarkdownEditor 