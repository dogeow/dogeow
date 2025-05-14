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

    // 行内代码处理: 如果输入了第二个反引号且在一对反引号之间有文本，就将其转换为行内代码
    if (text === '`' && selection && Range.isCollapsed(selection)) {
      const { anchor } = selection
      const inlineCodeStart = Editor.before(editor, anchor, { unit: 'character' })
      
      if (inlineCodeStart) {
        const range = { anchor, focus: inlineCodeStart }
        const textBefore = Editor.string(editor, range)
        // 检查文本是否以反引号开始
        const lastChar = textBefore.charAt(textBefore.length - 1)
        
        if (lastChar === '`') {
          // 选择包含开始反引号的文本范围
          const fullRange = {
            anchor,
            focus: Editor.before(editor, inlineCodeStart, { unit: 'character' }) || inlineCodeStart
          }
          const content = Editor.string(editor, { anchor: fullRange.focus, focus: anchor }).slice(1)
          
          if (content.trim().length > 0) {
            // 删除所有内容包括反引号
            Transforms.delete(editor, { at: fullRange })
            
            // 插入带有code标记的内容
            Transforms.insertNodes(editor, {
              text: content,
              code: true
            })
            return
          }
        }
      }
    }

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