"use client"

import { useState, useCallback, useEffect, useRef } from 'react'
import { createEditor, Descendant, Element as SlateElement, Transforms, Editor, BaseEditor, Node, Range as SlateRange, Point } from 'slate'
import { Slate, Editable, withReact, ReactEditor, RenderElementProps, RenderLeafProps } from 'slate-react'
import { withHistory, HistoryEditor } from 'slate-history'
import { Button } from "@/components/ui/button"
import { Bold, Italic, List, ListOrdered, Code, Save, Quote, Heading1, Heading2, ImageIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { put } from '@/utils/api'
import NoteImageUploader from './ImageUploader'
import { CustomElement, CustomText, HOTKEYS, LIST_TYPES } from '../types/editor'
import isHotkey from 'is-hotkey'
import Prism from 'prismjs'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-php'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-cpp'
import 'prismjs/components/prism-csharp'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-yaml'
import 'prismjs/components/prism-ruby'
import 'prismjs/components/prism-rust'
import 'prismjs/components/prism-scss'
import 'prismjs/components/prism-swift'

// 导入自定义Prism CSS
import '../styles/prism.css'

interface MarkdownEditorProps {
  noteId: number
  initialContent?: string
}

// 定义元素类型 - 这是为了保持代码一致性，但我们使用CustomElement中的类型
type ElementType = CustomElement['type']

// 节点条目类型
type NodeEntry<T = Node> = [T, number[]];

// 范围类型
interface TokenRange extends SlateRange {
  token: boolean
  [key: string]: any
}

// 创建扩展编辑器类型
type ExtendedEditor = BaseEditor & ReactEditor & HistoryEditor & {
  nodeToDecorations?: Map<SlateElement, TokenRange[]>
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
// 这是一个 PHP 注释
$variable = "Hello, World!";
echo $variable;
$number = 233;
echo $number;

function test() {
  return true;
}

if (test()) {
  echo "Function returned true!";
}
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
  const { insertText, deleteBackward } = editor

  editor.insertText = (text) => {
    const { selection } = editor

    // 检查是否在代码块中，如果是则使用默认行为
    const [codeBlock] = Editor.nodes(editor, {
      match: n => SlateElement.isElement(n) && n.type === 'code-block',
    })
    
    if (codeBlock) {
      return insertText(text)
    }

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

  // 自定义 deleteBackward 以便在代码块末尾删除时不立即转换为段落
  editor.deleteBackward = unit => {
    const { selection } = editor
    
    if (selection && SlateRange.isCollapsed(selection)) {
      const [codeBlock] = Editor.nodes(editor, {
        match: n => SlateElement.isElement(n) && n.type === 'code-block',
      })
      
      if (codeBlock) {
        const [node, path] = codeBlock
        const start = Editor.start(editor, path)
        
        // 检查是否在代码块的开始位置
        const isAtStart = Point.equals(selection.anchor, start)
        
        if (isAtStart) {
          // 在代码块起始位置按退格键时，转换为段落
          Transforms.setNodes(
            editor,
            { type: 'paragraph' },
            { match: n => SlateElement.isElement(n) && n.type === 'code-block' }
          )
          return
        }
      }
    }
    
    // 如果不是以上情况，使用默认行为
    deleteBackward(unit)
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

// 获取代码块节点的装饰范围
const getChildNodeToDecorations = ([block, blockPath]: NodeEntry<SlateElement>): Map<SlateElement, TokenRange[]> => {
  const nodeToDecorations = new Map<SlateElement, TokenRange[]>();
  
  if (block.type !== 'code-block' || !block.language) {
    return nodeToDecorations;
  }

  try {
    // 获取代码块的所有文本
    const text = Node.string(block);
    if (!text) return nodeToDecorations;
    
    const language = block.language;
    
    // 确保语言已加载
    let grammar = Prism.languages[language];
    if (!grammar) {
      console.warn(`没有找到语言: ${language}, 使用普通文本`);
      grammar = Prism.languages.text || {};
    }
    
    // 使用 Prism 标记化文本 - 使用 try-catch 避免可能的错误
    let tokens;
    try {
      tokens = Prism.tokenize(text, grammar);
    } catch (err) {
      console.warn(`标记化失败: ${err}, 使用普通文本`);
      // 如果标记化失败，将整个文本作为一个标记处理
      tokens = [text];
    }
    
    // 使用数组存储范围
    const ranges: TokenRange[] = [];
    
    // 递归处理 tokens 并生成装饰范围
    const processTokens = (tokens: (string | Prism.Token)[], offset = 0) => {
      let currentOffset = offset;
      
      for (const token of tokens) {
        if (typeof token === 'string') {
          // 纯文本标记 - 跳过，不需要高亮
          currentOffset += token.length;
        } else {
          const content = token.content;
          
          // 处理字符串内容
          if (typeof content === 'string') {
            // 单个 token
            const tokenLength = content.length;
            
            if (tokenLength > 0) {
              // 创建范围对象并包含token类型
              const range: TokenRange = {
                anchor: { path: blockPath, offset: currentOffset },
                focus: { path: blockPath, offset: currentOffset + tokenLength },
                token: true,
                [token.type]: true
              };
              
              ranges.push(range);
              currentOffset += tokenLength;
            }
          } 
          // 处理嵌套内容
          else if (Array.isArray(content)) {
            // 嵌套 tokens - 递归处理
            const startOffset = currentOffset;
            
            // 计算嵌套内容的范围
            let contentText = '';
            if (typeof token.content === 'string') {
              contentText = token.content;
            } else if (Array.isArray(token.content)) {
              contentText = token.content.map(t => 
                typeof t === 'string' ? t : 
                (typeof t.content === 'string' ? t.content : '')
              ).join('');
            }
            
            const contentLength = contentText.length;
            
            // 为父 token 创建一个范围
            if (contentLength > 0) {
              const parentRange: TokenRange = {
                anchor: { path: blockPath, offset: startOffset },
                focus: { path: blockPath, offset: startOffset + contentLength },
                token: true,
                [token.type]: true
              };
              
              ranges.push(parentRange);
            }
            
            // 递归处理嵌套标记
            processTokens(content, startOffset);
            currentOffset = startOffset + contentLength;
          }
        }
      }
      
      return currentOffset;
    };
    
    processTokens(tokens);
    
    // 只有当有范围时才设置
    if (ranges.length > 0) {
      nodeToDecorations.set(block, ranges);
    }
    
  } catch (error) {
    console.error('代码高亮处理错误:', error);
  }
  
  return nodeToDecorations;
};

// 装饰器函数
const useDecorate = (editor: ExtendedEditor) => {
  return useCallback(
    ([node, path]: NodeEntry) => {
      if (!editor.nodeToDecorations) {
        return [];
      }
      
      // 如果当前节点是代码块，应用代码高亮
      if (SlateElement.isElement(node) && node.type === 'code-block') {
        // 直接从 nodeToDecorations 映射中获取装饰范围
        return editor.nodeToDecorations.get(node) || [];
      }
      
      return [];
    },
    [editor.nodeToDecorations]
  );
};

// 合并多个Map
const mergeMaps = <K, V>(...maps: Map<K, V>[]) => {
  const map = new Map<K, V>();
  
  for (const m of maps) {
    for (const [key, value] of m) {
      map.set(key, value);
    }
  }
  
  return map;
};

// 语言选择组件
const LanguageSelector = ({ value, onChange }: { value?: string, onChange: (value: string) => void }) => {
  return (
    <select
      contentEditable={false}
      className="absolute right-2 top-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm"
      value={value || 'text'}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
    >
      <option value="bash">Bash</option>
      <option value="c">C</option>
      <option value="cpp">C++</option>
      <option value="csharp">C#</option>
      <option value="css">CSS</option>
      <option value="go">Go</option>
      <option value="html">HTML</option>
      <option value="java">Java</option>
      <option value="javascript">JavaScript</option>
      <option value="json">JSON</option>
      <option value="jsx">JSX</option>
      <option value="markdown">Markdown</option>
      <option value="php">PHP</option>
      <option value="python">Python</option>
      <option value="ruby">Ruby</option>
      <option value="rust">Rust</option>
      <option value="scss">SCSS</option>
      <option value="sql">SQL</option>
      <option value="swift">Swift</option>
      <option value="tsx">TSX</option>
      <option value="typescript">TypeScript</option>
      <option value="xml">XML</option>
      <option value="yaml">YAML</option>
      <option value="text">纯文本</option>
    </select>
  );
};

// 预计算代码高亮范围
const PrecalculateCodeHighlighting = ({ editor, value }: { editor: ExtendedEditor, value: Descendant[] }) => {
  // 使用 useEffect 在组件挂载和值变化时更新高亮
  useEffect(() => {
    try {
      // 使用 requestAnimationFrame 延迟到下一帧执行，避免阻塞 UI
      const frameId = requestAnimationFrame(() => {
        // 找到所有代码块
        const entries = Array.from(
          Editor.nodes<SlateElement>(editor, {
            at: [],
            match: n => SlateElement.isElement(n) && n.type === 'code-block',
          })
        );
        
        if (entries.length > 0) {
          // 为每个代码块生成装饰范围
          const decorationMaps = entries.map(getChildNodeToDecorations);
          
          // 合并所有装饰范围
          const nodeToDecorations = mergeMaps(...decorationMaps);
          
          // 更新编辑器
          editor.nodeToDecorations = nodeToDecorations;
        }
      });
      
      // 清理函数，取消未执行的动画帧请求
      return () => cancelAnimationFrame(frameId);
    } catch (error) {
      console.error('预计算代码高亮时出错:', error);
    }
  }, [editor, value]);
  
  return null;
};

// 处理Tab键
const handleCodeBlockTab = (event: React.KeyboardEvent<HTMLDivElement>, editor: ExtendedEditor) => {
  // 检查当前是否在代码块中
  const [match] = Editor.nodes(editor, {
    match: n => SlateElement.isElement(n) && n.type === 'code-block',
  });
  
  if (match) {
    // 在代码块中处理Tab键 
    if (isHotkey('tab', event)) {
      event.preventDefault();
      Editor.insertText(editor, '  '); // 插入两个空格
      return true;
    }
    
    // 在代码块中处理Enter键
    if (isHotkey('enter', event)) {
      event.preventDefault();
      Editor.insertText(editor, '\n'); // 只插入换行符，不创建新块
      return true;
    }
  }
  
  return false;
};

// Markdown编辑器组件
const MarkdownEditor = ({ noteId, initialContent = '' }: MarkdownEditorProps) => {
  // 创建编辑器实例
  const [editor] = useState<ExtendedEditor>(() => 
    withMarkdownShortcuts(withHistory(withReact(createEditor())))
  )
  
  // 编辑器内容状态
  const [value, setValue] = useState<Descendant[]>(() => 
    deserializeContent(initialContent)
  )
  
  // 保存状态
  const [isSaving, setIsSaving] = useState(false)
  
  // 显示图片上传弹窗状态
  const [showImageUploader, setShowImageUploader] = useState(false)
  
  // 使用 useRef 跟踪上一次高亮更新的时间
  const lastHighlightTime = useRef(0);
  // 防抖定时器 ID
  const highlightTimerRef = useRef<number | null>(null);
  
  // 执行高亮更新的函数
  const performHighlightUpdate = useCallback(() => {
    lastHighlightTime.current = Date.now();
    
    try {
      // 不使用 requestAnimationFrame，确保立即更新
      // 找到所有代码块
      const entries = Array.from(
        Editor.nodes<SlateElement>(editor, {
          at: [],
          match: n => SlateElement.isElement(n) && n.type === 'code-block',
        })
      );
      
      if (entries.length > 0) {
        // 为每个代码块生成装饰范围
        const decorationMaps = entries.map(getChildNodeToDecorations);
        // 合并所有装饰范围
        const nodeToDecorations = mergeMaps(...decorationMaps);
        // 更新编辑器
        editor.nodeToDecorations = nodeToDecorations;
      }
    } catch (error) {
      console.error('更新代码高亮出错:', error);
    }
  }, [editor]);
  
  // 更新代码高亮的函数
  const updateCodeHighlighting = useCallback(() => {
    // 为了解决空格键问题，移除防抖处理，立即计算高亮
    performHighlightUpdate();
  }, [performHighlightUpdate]);
  
  // 代码高亮装饰器
  const decorate = useDecorate(editor)
  
  // 组件挂载和更新时更新 Prism
  useEffect(() => {
    // 确保 Prism 声明了所有需要的语言
    if (Prism && Prism.languages) {
      // 如果 Prism.languages.text 不存在，添加一个空的 text 语言
      if (!Prism.languages.text) {
        Prism.languages.text = {}
      }
      
      if (!Prism.languages.plain) {
        Prism.languages.plain = {}
      }
    }
    
    // 立即初始化代码高亮
    try {
      requestAnimationFrame(() => {
        // 找到所有代码块
        const entries = Array.from(
          Editor.nodes<SlateElement>(editor, {
            at: [],
            match: n => SlateElement.isElement(n) && n.type === 'code-block',
          })
        );
        
        if (entries.length > 0) {
          // 为每个代码块生成装饰范围
          const decorationMaps = entries.map(getChildNodeToDecorations);
          // 合并所有装饰范围
          const nodeToDecorations = mergeMaps(...decorationMaps);
          // 更新编辑器
          editor.nodeToDecorations = nodeToDecorations;
        }
      });
    } catch (error) {
      console.error('初始化代码高亮出错:', error);
    }
    
    // 清理函数
    return () => {
      // 清除定时器
      if (highlightTimerRef.current !== null) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, [editor])
  
  // 处理值变化，每次输入都更新高亮
  const handleValueChange = useCallback((newValue: Descendant[]) => {
    setValue(newValue);
    
    // 检查是否有代码块
    const hasCodeBlock = newValue.some(node => 
      SlateElement.isElement(node) && 
      (node.type === 'code-block' || 
       (Array.isArray(node.children) && node.children.some(child => 
         SlateElement.isElement(child) && child.type === 'code-block'
       ))
      )
    );
      
    // 如果有代码块，则每次输入都更新高亮
    if (hasCodeBlock) {
      // 立即更新高亮
      updateCodeHighlighting();
    }
  }, [updateCodeHighlighting]);
  
  // 渲染元素
  const renderElement = useCallback((props: RenderElementProps) => {
    const { attributes, children, element } = props
    
    switch (element.type) {
      case 'block-quote':
        return <blockquote className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 italic" {...attributes}>{children}</blockquote>
      case 'bulleted-list':
        return <ul className="list-disc list-inside" {...attributes}>{children}</ul>
      case 'heading-one':
        return <h1 className="text-2xl font-bold mt-6 mb-4" {...attributes}>{children}</h1>
      case 'heading-two':
        return <h2 className="text-xl font-bold mt-5 mb-3" {...attributes}>{children}</h2>
      case 'heading-three':
        return <h3 className="text-lg font-bold mt-4 mb-2" {...attributes}>{children}</h3>
      case 'list-item':
        return <li {...attributes}>{children}</li>
      case 'numbered-list':
        return <ol className="list-decimal list-inside" {...attributes}>{children}</ol>
      case 'image':
        return (
          <div {...attributes} className="relative my-4">
            <div contentEditable={false} className="text-center">
              <img src={element.url} alt="" className="max-w-full h-auto" style={{ maxHeight: '400px' }} />
            </div>
            {children}
          </div>
        )
      case 'code-block':
        const language = element.language || 'text'
        return (
          <div {...attributes} className="relative font-mono text-sm bg-gray-100 dark:bg-gray-800 p-4 my-2 rounded overflow-auto" spellCheck={false}>
            <LanguageSelector 
              value={language} 
              onChange={(newLanguage) => {
                const path = ReactEditor.findPath(editor, element)
                Transforms.setNodes(editor, { language: newLanguage }, { at: path })
              }} 
            />
            <pre className="pt-8 whitespace-pre-wrap break-words">
              <code className={`language-${language}`} data-language={language}>
                {children}
              </code>
            </pre>
          </div>
        )
      default:
        return <p className="my-2" {...attributes}>{children}</p>
    }
  }, [])
  
  // 渲染文字
  const renderLeaf = useCallback((props: RenderLeafProps) => {
    const { attributes, children, leaf } = props
    
    // 应用不同的样式类
    if (leaf.bold) {
      return <strong {...attributes}>{children}</strong>
    }
    
    if (leaf.italic) {
      return <em {...attributes}>{children}</em>
    }
    
    if (leaf.code) {
      return <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...attributes}>{children}</code>
    }
    
    // 检查是否有任何代码高亮相关的属性
    const tokenTypes = [
      'token', 'comment', 'prolog', 'doctype', 'cdata',
      'punctuation', 'namespace', 'property', 'tag',
      'boolean', 'number', 'constant', 'symbol', 'deleted',
      'selector', 'attr-name', 'string', 'char', 'builtin',
      'inserted', 'operator', 'entity', 'url', 'atrule',
      'attr-value', 'keyword', 'function', 'class-name',
      'regex', 'important', 'variable'
    ];
    
    const hasHighlightProps = Object.keys(leaf).some(key => 
      tokenTypes.includes(key) && key !== 'text'
    );
    
    // 代码高亮样式
    if (hasHighlightProps) {
      // 创建基于token类型的className
      const classNames = tokenTypes
        .filter(type => leaf[type as keyof typeof leaf])
        .map(type => type);
      
      const className = classNames.length > 0 ? classNames.join(' ') : undefined;
      
      return (
        <span 
          {...attributes} 
          className={className}
          data-token={true}
        >
          {children}
        </span>
      );
    }
    
    return <span {...attributes}>{children}</span>;
  }, [])
  
  // 保存笔记内容
  const saveNote = async () => {
    setIsSaving(true)
    try {
      const serialized = serializeContent(value)
      await put(`/notes/${noteId}`, { content: serialized })
      toast.success('笔记已保存')
    } catch (error) {
      console.error('保存笔记失败:', error)
      toast.error('保存笔记失败')
    } finally {
      setIsSaving(false)
    }
  }
  
  // 处理快捷键
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // 处理代码块中的Tab键和Enter键
    if (handleCodeBlockTab(event, editor)) {
      return;
    }
    
    // 如果在代码块中按下空格键，手动触发高亮更新
    if (event.key === ' ') {
      const [codeBlock] = Editor.nodes(editor, {
        match: n => SlateElement.isElement(n) && n.type === 'code-block',
      });
      
      if (codeBlock) {
        // 空格键之后立即强制更新高亮
        setTimeout(() => updateCodeHighlighting(), 0);
      }
    }
    
    // 处理常规快捷键
    for (const hotkey in HOTKEYS) {
      if (isHotkey(hotkey, event)) {
        event.preventDefault()
        const mark = HOTKEYS[hotkey as keyof typeof HOTKEYS]
        toggleMark(mark)
      }
    }
    
    // Ctrl+S / Cmd+S 保存
    if (isHotkey('mod+s', event)) {
      event.preventDefault()
      saveNote()
    }
  }
  
  // 格式按钮点击处理
  const handleFormatClick = (format: string) => {
    // 文本格式按钮的处理
    if (['bold', 'italic', 'code'].includes(format)) {
      toggleMark(format)
    } else {
      // 块级格式按钮的处理
      toggleBlock(format as ElementType)
    }
  }
  
  // 切换文本格式
  const toggleMark = (format: string) => {
    const isActive = isMarkActive(format)
    
    if (isActive) {
      Editor.removeMark(editor, format)
    } else {
      Editor.addMark(editor, format, true)
    }
  }
  
  // 检查文本格式是否激活
  const isMarkActive = (format: string) => {
    const marks = Editor.marks(editor)
    return marks ? marks[format as keyof typeof marks] === true : false
  }
  
  // 切换块级格式
  const toggleBlock = (format: ElementType) => {
    const isActive = isBlockActive(format)
    
    // 对列表的特殊处理
    const isList = LIST_TYPES.includes(format)
    
    Transforms.unwrapNodes(editor, {
      match: n =>
        LIST_TYPES.includes((n as CustomElement).type as string) &&
        SlateElement.isElement(n),
      split: true,
    })
    
    const newProperties: Partial<SlateElement> = {
      type: isActive ? 'paragraph' : isList ? 'list-item' : format,
    }
    
    Transforms.setNodes(editor, newProperties)
    
    if (!isActive && isList) {
      const block = { type: format, children: [] }
      Transforms.wrapNodes(editor, block)
    }
  }
  
  // 检查块级格式是否激活
  const isBlockActive = (format: ElementType) => {
    const [match] = Editor.nodes(editor, {
      match: n =>
        SlateElement.isElement(n) && n.type === format,
    })
    
    return !!match
  }
  
  return (
    <>
      <div className="border rounded-md overflow-hidden">
        <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50 dark:bg-gray-800">
          <Button
            onClick={() => handleFormatClick('bold')}
            size="sm"
            variant={isMarkActive('bold') ? 'default' : 'outline'}
            className="h-8 px-2 py-1"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => handleFormatClick('italic')}
            size="sm"
            variant={isMarkActive('italic') ? 'default' : 'outline'}
            className="h-8 px-2 py-1"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => handleFormatClick('code')}
            size="sm"
            variant={isMarkActive('code') ? 'default' : 'outline'}
            className="h-8 px-2 py-1"
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => handleFormatClick('heading-one')}
            size="sm"
            variant={isBlockActive('heading-one') ? 'default' : 'outline'}
            className="h-8 px-2 py-1"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => handleFormatClick('heading-two')}
            size="sm"
            variant={isBlockActive('heading-two') ? 'default' : 'outline'}
            className="h-8 px-2 py-1"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => handleFormatClick('block-quote')}
            size="sm"
            variant={isBlockActive('block-quote') ? 'default' : 'outline'}
            className="h-8 px-2 py-1"
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => handleFormatClick('bulleted-list')}
            size="sm"
            variant={isBlockActive('bulleted-list') ? 'default' : 'outline'}
            className="h-8 px-2 py-1"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => handleFormatClick('numbered-list')}
            size="sm"
            variant={isBlockActive('numbered-list') ? 'default' : 'outline'}
            className="h-8 px-2 py-1"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => handleFormatClick('code-block')}
            size="sm"
            variant={isBlockActive('code-block') ? 'default' : 'outline'}
            className="h-8 px-2 py-1"
          >
            <Code className="h-4 w-4" />
            <span className="ml-1">代码块</span>
          </Button>
          <Button
            onClick={() => setShowImageUploader(true)}
            size="sm"
            variant="outline"
            className="h-8 px-2 py-1"
          >
            <ImageIcon className="h-4 w-4" />
            <span className="ml-1">图片</span>
          </Button>
          
          <div className="ml-auto">
            <Button
              onClick={saveNote}
              disabled={isSaving}
              size="sm"
              className="h-8"
            >
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? '保存中...' : '保存笔记'}
            </Button>
          </div>
        </div>
        
        <Slate
          editor={editor}
          initialValue={value}
          onChange={handleValueChange}
        >
          <Editable
            className="p-4 min-h-[400px] focus:outline-none"
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            decorate={decorate}
            onKeyDown={onKeyDown}
            placeholder="开始编写笔记内容..."
            spellCheck={false}
            autoFocus
            onFocus={() => {
              // 聚焦时更新代码高亮
              updateCodeHighlighting();
            }}
            onBlur={() => {
              // 失焦时更新代码高亮
              updateCodeHighlighting();
            }}
          />
        </Slate>
        
        {showImageUploader && (
          <NoteImageUploader
            onImageUploaded={(url: string) => {
              // 插入图片
              const image: CustomElement = {
                type: 'image',
                url,
                children: [{ text: '' }],
              }
              Transforms.insertNodes(editor, image)
              setShowImageUploader(false)
            }}
          />
        )}
      </div>
    </>
  )
}

export default MarkdownEditor 