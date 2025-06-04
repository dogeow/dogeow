import { Editor, Element as SlateElement, Range as SlateRange, Transforms, Node, Point } from 'slate'
import { ExtendedEditor } from '../types'
import { CustomElement } from '@/app/note/types/editor'
import { getChildNodeToDecorations, mergeMaps } from '../prism-utils'

// Markdown 快捷方式类型定义
type MarkdownShortcut = '#' | '##' | '>' | '-' | '*' | '+' | '1.' | '```'

// 检查 Markdown 快捷方式
const checkMarkdownShortcut = (text: string): RegExpExecArray | null => {
  return /^(\#\#|\#|\>|\-|\*|\+|1\.|\`\`\`)$/.exec(text)
}

// 更新代码高亮
const updateCodeHighlight = (editor: ExtendedEditor) => {
  try {
    const entries = Array.from(
      Editor.nodes<SlateElement>(editor, {
        at: [],
        match: n => SlateElement.isElement(n) && (n as CustomElement).type === 'code-block',
      })
    )
    
    if (entries.length > 0) {
      const decorationMaps = entries.map(getChildNodeToDecorations)
      const nodeToDecorations = mergeMaps(...decorationMaps)
      editor.nodeToDecorations = nodeToDecorations
      
      // 移除直接操作 selection 的代码，让 Slate 自己管理光标位置
      // 只需要更新装饰即可，不要手动操作选区
    }
  } catch (error) {
    console.error('更新代码高亮出错:', error)
  }
}

// 处理 Markdown 快捷方式
const handleMarkdownShortcut = (editor: ExtendedEditor, type: MarkdownShortcut) => {
  const transforms: Record<MarkdownShortcut, () => void> = {
    '#': () => {
      Transforms.setNodes(
        editor,
        { type: 'heading-one' },
        { match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) }
      )
    },
    '##': () => {
      Transforms.setNodes(
        editor,
        { type: 'heading-two' },
        { match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) }
      )
    },
    '>': () => {
      Transforms.setNodes(
        editor,
        { type: 'block-quote' },
        { match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) }
      )
    },
    '-': () => handleListTransform(editor, 'bulleted-list'),
    '*': () => handleListTransform(editor, 'bulleted-list'),
    '+': () => handleListTransform(editor, 'bulleted-list'),
    '1.': () => handleListTransform(editor, 'numbered-list'),
    '```': () => {
      Transforms.setNodes(
        editor,
        { type: 'code-block' },
        { match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) }
      )
    }
  }

  transforms[type]?.()
}

// 处理列表转换
const handleListTransform = (editor: ExtendedEditor, listType: 'bulleted-list' | 'numbered-list') => {
  Transforms.setNodes(
    editor,
    { type: 'list-item' },
    { match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) }
  )
  
  Transforms.wrapNodes(
    editor,
    { type: listType, children: [] } as unknown as CustomElement,
    { match: n => SlateElement.isElement(n) && (n as CustomElement).type === 'list-item' }
  )
}

// 自定义扩展编辑器
export const withMarkdownShortcuts = (editor: ExtendedEditor) => {
  const { insertText, deleteBackward } = editor

  editor.insertText = (text) => {
    const { selection } = editor

    // 检查是否在代码块中
    const [codeBlock] = Editor.nodes(editor, {
      match: n => SlateElement.isElement(n) && (n as CustomElement).type === 'code-block',
    })
    
    if (codeBlock) {
      insertText(text)
      requestAnimationFrame(() => updateCodeHighlight(editor))
      return
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

      const beforeMatch = checkMarkdownShortcut(beforeText)
      if (beforeMatch) {
        const type = beforeMatch[1] as MarkdownShortcut
        
        if (type === '```') {
          insertText(text)
          return
        }
        
        Transforms.select(editor, range)
        Transforms.delete(editor)
        handleMarkdownShortcut(editor, type)
        return
      }
    }

    insertText(text)
  }

  editor.deleteBackward = unit => {
    const { selection } = editor
    
    if (selection && SlateRange.isCollapsed(selection)) {
      const [codeBlock] = Editor.nodes(editor, {
        match: n => SlateElement.isElement(n) && (n as CustomElement).type === 'code-block',
      })
      
      if (codeBlock) {
        const [node, path] = codeBlock
        const start = Editor.start(editor, path)
        const isAtStart = Point.equals(selection.anchor, start)
        const text = Node.string(node)
        
        if (isAtStart || text.trim() === '') {
          Transforms.setNodes(
            editor,
            { type: 'paragraph' },
            { match: n => SlateElement.isElement(n) && (n as CustomElement).type === 'code-block' }
          )
          return
        }
      }
    }
    
    deleteBackward(unit)
  }

  return editor
}