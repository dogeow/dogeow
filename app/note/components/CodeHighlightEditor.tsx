"use client"

import { useState, useCallback, useEffect } from 'react'
import { createEditor, Descendant, Element as SlateElement, Transforms, Editor, Text, BaseEditor, Node, Range as SlateRange, Path } from 'slate'
import { Slate, Editable, withReact, ReactEditor, RenderElementProps, RenderLeafProps, useSlate } from 'slate-react'
import { withHistory, HistoryEditor } from 'slate-history'
import { Button } from "@/components/ui/button"
import { Bold, Italic, List, ListOrdered, Code, Save, FileText, Quote, Heading1, Heading2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { put } from '@/utils/api'
import Prism from 'prismjs'

// 导入Prism语言支持
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-php'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-cpp'
import 'prismjs/components/prism-java'

// 导入Prism主题样式
import 'prismjs/themes/prism-okaidia.css'

// 导入自定义样式，用于修复嵌套token的问题
import './prism-custom.css'
import { mergeMaps, normalizeTokens } from './utils'

// 确保Prism正确初始化
if (typeof window !== 'undefined') {
  window.Prism = window.Prism || {};
  window.Prism.manual = true;
}

interface CodeHighlightEditorProps {
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
// PHP示例代码
function sayHello($name) {
    return "Hello, " . $name . "!";
}

echo sayHello("World");

$number = 123;
$string = "这是一个字符串";
$boolean = true;

// 类的定义
class Person {
    private $name;
    
    public function __construct($name) {
        $this->name = $name;
    }
    
    public function getName() {
        return $this->name;
    }
}

$person = new Person("张三");
echo $person->getName();
?>`
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

// Prism语言映射
const PRISM_LANGUAGE_MAP: Record<string, string> = {
  'js': 'javascript',
  'ts': 'typescript',
  'jsx': 'jsx',
  'tsx': 'tsx',
  'py': 'python',
  'php': 'php',
  'css': 'css',
  'html': 'html',
  'md': 'markdown',
  'json': 'json',
  'bash': 'bash',
  'sql': 'sql',
  'c': 'c',
  'cpp': 'cpp',
  'java': 'java',
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

// 为代码块获取装饰范围
const getChildNodeToDecorations = (
  [block, blockPath]: NodeEntry
): Map<Element, TokenRange[]> => {
  const nodeToDecorations = new Map<Element, TokenRange[]>()
  
  // 只处理代码块
  if (!SlateElement.isElement(block) || (block as CustomElement).type !== 'code-block') {
    return nodeToDecorations
  }
  
  const language = (block as CustomElement).language || 'text'
  const prismLanguage = PRISM_LANGUAGE_MAP[language] || language
  
  // 如果没有对应的Prism语言定义，直接返回
  if (!Prism.languages[prismLanguage]) {
    return nodeToDecorations
  }
  
  // 获取代码块的完整文本
  const text = Node.string(block)
  
  try {
    // 使用Prism解析文本
    const tokens = Prism.tokenize(text, Prism.languages[prismLanguage])
    const normalizedTokens = normalizeTokens(tokens)
    
    // 处理代码块中的每一行
    const blockChildren = block.children
    
    for (let index = 0; index < normalizedTokens.length && index < blockChildren.length; index++) {
      const tokens = normalizedTokens[index]
      // 使用类型断言转换成Element类型
      const element = blockChildren[index] as unknown as Element
      
      if (!nodeToDecorations.has(element)) {
        nodeToDecorations.set(element, [])
      }
      
      let start = 0
      for (const token of tokens) {
        const length = token.content.length
        if (!length) {
          continue
        }
        
        const end = start + length
        const path = [...blockPath, index, 0]
        
        const range = {
          anchor: { path, offset: start },
          focus: { path, offset: end },
          token: true,
          ...Object.fromEntries(token.types.map(type => [type, true])),
        }
        
        nodeToDecorations.get(element)!.push(range)
        
        start = end
      }
    }
  } catch (error) {
    console.error('Prism token processing error:', error)
  }
  
  return nodeToDecorations
}

// 预计算所有代码块的装饰
const SetNodeToDecorations = () => {
  const editor = useSlate() as ExtendedEditor
  
  const blockEntries = Array.from(
    Editor.nodes(editor, {
      at: [],
      mode: 'highest',
      match: n => SlateElement.isElement(n) && (n as CustomElement).type === 'code-block',
    })
  )
  
  const nodeToDecorations = mergeMaps(
    ...blockEntries.map(entry => getChildNodeToDecorations(entry))
  )
  
  // 使用类型断言处理赋值
  editor.nodeToDecorations = nodeToDecorations as Map<Element, TokenRange[]>
  
  return null
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

// 返回代码主题CSS样式
const prismThemeCss = `
  /* 确保代码高亮样式 - 主题CSS */
  .code-block {
    background-color: #1e1e1e !important;
    color: #d4d4d4 !important;
  }
  
  .token.comment { color: #6A9955 !important; }
  .token.keyword { color: #569CD6 !important; }
  .token.function { color: #DCDCAA !important; }
  .token.string { color: #CE9178 !important; }
  .token.number { color: #B5CEA8 !important; }
  .token.variable { color: #9CDCFE !important; }
  .token.php-tag { 
    color: #808080 !important; 
    background: rgba(255,255,255,0.1);
  }
`

const CodeHighlightEditor = ({ noteId, initialContent = '' }: CodeHighlightEditorProps) => {
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

  // 添加调试功能
  const debugHighlighting = useCallback(() => {
    const blockEntries = Array.from(
      Editor.nodes(editor, {
        at: [],
        mode: 'highest',
        match: n => SlateElement.isElement(n) && (n as CustomElement).type === 'code-block',
      })
    )
    
    console.log('Code blocks:', blockEntries.length)
    
    blockEntries.forEach(([node], i) => {
      console.log(`Block ${i + 1}:`, node)
      console.log(`Language:`, (node as CustomElement).language)
      console.log(`Text:`, Node.string(node))
    })
    
    console.log('Decoration map:', editor.nodeToDecorations)
    
    // 显示消息
    toast.success('调试信息已打印到控制台')
  }, [editor])

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
      case 'code-block':
        const language = (element as CustomElement).language || 'text'
        // 获取语言显示名称，使其更用户友好
        const languageDisplayName = (() => {
          switch(language) {
            case 'js': return 'JavaScript'
            case 'ts': return 'TypeScript'
            case 'py': return 'Python'
            case 'php': return 'PHP'
            case 'css': return 'CSS'
            case 'html': return 'HTML'
            case 'md': return 'Markdown'
            case 'json': return 'JSON'
            case 'bash': return 'Bash'
            case 'sql': return 'SQL'
            default: return language.charAt(0).toUpperCase() + language.slice(1)
          }
        })()
        
        return (
          <pre {...attributes} className="code-block">
            <div className="language-identifier">
              {languageDisplayName}
              <span className="exit-hint"> (Shift+Enter 退出代码块)</span>
            </div>
            <code className={`language-${language}`}>{children}</code>
          </pre>
        )
      default:
        return <p {...attributes} className="my-2">{children}</p>
    }
  }, [])

  // 自定义叶子渲染
  const renderLeaf = useCallback((props: RenderLeafProps) => {
    const { attributes, children, leaf } = props
    const { text, ...rest } = leaf as CustomText & { [key: string]: any }
    
    let className = ''
    
    // 处理代码高亮
    if (rest.token) {
      // 获取所有token类型，构建className
      className = Object.keys(rest)
        .filter(key => key !== 'text' && key !== 'token' && rest[key] === true)
        .join(' ')
    }
    
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
      case 'code-block':
        insertCodeBlock()
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

  // 插入代码块
  const insertCodeBlock = () => {
    const language = prompt('输入代码语言 (如: js, ts, php, python, css, html, etc.):')
    
    if (language === null) return // 用户取消了输入
    
    const codeBlock: CustomElement = {
      type: 'code-block',
      language: language || 'text',
      children: [{ text: '' }],
    }
    
    Transforms.insertNodes(editor, codeBlock)
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

    // 从代码块退出：Shift+Enter
    if (event.key === 'Enter' && event.shiftKey) {
      const codeBlockEntry = Editor.above(editor, {
        match: n => 
          SlateElement.isElement(n) && 
          (n as CustomElement).type === 'code-block',
      });

      if (codeBlockEntry) {
        event.preventDefault();
        
        // 获取当前选择位置
        const { selection } = editor;
        if (!selection) return;
        
        // 在代码块后插入一个新的段落
        const [, path] = codeBlockEntry;
        const newPath = Path.next(path);
        
        Transforms.insertNodes(
          editor,
          { type: 'paragraph', children: [{ text: '' }] },
          { at: newPath }
        );
        
        // 将光标移动到新段落
        Transforms.select(editor, Editor.start(editor, newPath));
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
          
          <Button 
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleFormatClick('code-block')}
            title="代码块"
            className="h-9 w-9"
          >
            <FileText className="h-5 w-5" />
          </Button>

          <div className="ml-auto flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={debugHighlighting}
              title="调试高亮"
              className="flex items-center gap-1"
            >
              调试
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
        
        <div className="relative">
          <Slate 
            editor={editor}
            initialValue={value}
            onChange={value => setValue(value)}
          >
            <SetNodeToDecorations />
            <Editable
              className="min-h-[400px] p-4 outline-none font-mono text-base leading-normal"
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              spellCheck={false}
              onKeyDown={handleKeyDown}
              decorate={decorate}
              style={{ 
                lineHeight: '1.5',
                fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
              }}
              placeholder=""
            />
            {/* 添加内联样式，确保高亮生效 */}
            <style>{prismThemeCss}</style>
          </Slate>
        </div>
      </div>
    </div>
  )
}

export default CodeHighlightEditor 