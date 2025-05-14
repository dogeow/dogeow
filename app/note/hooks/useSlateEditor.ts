import { useMemo } from 'react'
import { createEditor, Editor, Transforms, Element as SlateElement, Text, Range, Point } from 'slate'
import { withReact, ReactEditor } from 'slate-react'
import { withHistory } from 'slate-history'
import { CustomElement } from '../types/editor'

// 处理快捷键输入
const withShortcuts = (editor: Editor) => {
  const { deleteBackward, insertText } = editor

  editor.insertText = (text) => {
    const { selection } = editor

    // 行内代码处理: 如果输入了结束反引号，检查是否有对应的开始反引号
    if (text === '`' && selection && Range.isCollapsed(selection)) {
      const { anchor } = selection
      const block = Editor.above(editor, {
        match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
      })
      
      if (block) {
        const [, path] = block
        const blockStart = Editor.start(editor, path)
        const blockRange = { anchor, focus: blockStart }
        const blockText = Editor.string(editor, blockRange)
        
        // 查找最近的未配对反引号
        let startPos = -1
        for (let i = blockText.length - 1; i >= 0; i--) {
          if (blockText[i] === '`') {
            // 确保这个反引号之前没有另一个反引号配对它
            let paired = false
            for (let j = i - 1; j >= 0; j--) {
              if (blockText[j] === '`') {
                paired = !paired;
              }
            }
            if (!paired) {
              startPos = i;
              break;
            }
          }
        }
        
        if (startPos !== -1) {
          // 找到了开始反引号，计算位置
          const offset = blockText.length - startPos
          const beforeLength = anchor.offset - offset
          const startPoint = { path: anchor.path, offset: beforeLength }
          
          // 获取要格式化为代码的文本内容
          const codeRange = { anchor, focus: startPoint }
          const codeText = Editor.string(editor, codeRange).slice(1) // 移除开始反引号
          
          if (codeText.trim().length > 0) {
            // 选择整个范围（包括开始反引号）
            Transforms.select(editor, codeRange)
            // 删除原始文本
            Transforms.delete(editor)
            // 插入带有代码格式的文本
            Transforms.insertNodes(editor, {
              text: codeText,
              code: true
            })
            
            return // 阻止插入结束反引号
          }
        }
      }
    }

    // Markdown 标记处理（标题、列表等）
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
          { type: 'bulleted-list', children: [] } as CustomElement,
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

// 创建并增强编辑器
export const useSlateEditor = () => {
  return useMemo(() => withShortcuts(withHistory(withReact(createEditor()))), [])
}

export default useSlateEditor 