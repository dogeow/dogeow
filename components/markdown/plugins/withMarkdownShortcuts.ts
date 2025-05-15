import { Editor, Element as SlateElement, Range as SlateRange, Transforms, Node, Point } from 'slate'
import { CustomElement, ExtendedEditor } from '../types'
import { checkCodeBlock, getChildNodeToDecorations, mergeMaps } from '../prism-utils'

// 检查Markdown快捷方式
const checkMarkdownShortcut = (text: string) => {
  return (
    // 标题、引用和列表标记的正则，不再包含代码块
    /^(\#\#|\#|\>|\-|\*|\+|1\.)$/.exec(text)
  )
}

// 自定义扩展编辑器，添加处理Markdown快捷方式功能
export const withMarkdownShortcuts = (editor: ExtendedEditor) => {
  const { insertText, deleteBackward } = editor

  editor.insertText = (text) => {
    const { selection } = editor

    // 检查是否在代码块中
    const [codeBlock] = Editor.nodes(editor, {
      match: n => SlateElement.isElement(n) && (n as CustomElement).type === 'code-block',
    })
    
    // 如果在代码块中，先执行默认插入文本，然后立即更新高亮
    if (codeBlock) {
      insertText(text)
      
      // 使用requestAnimationFrame确保在DOM更新后再更新高亮
      requestAnimationFrame(() => {
        try {
          // 找到所有代码块
          const entries = Array.from(
            Editor.nodes<SlateElement>(editor, {
              at: [],
              match: n => SlateElement.isElement(n) && (n as CustomElement).type === 'code-block',
            })
          );
          
          if (entries.length > 0) {
            // 为每个代码块生成装饰范围
            const decorationMaps = entries.map(getChildNodeToDecorations);
            // 合并所有装饰范围
            const nodeToDecorations = mergeMaps(...decorationMaps);
            // 更新编辑器
            editor.nodeToDecorations = nodeToDecorations;
            
            // 保存当前选区
            const currentSelection = editor.selection;
            if (currentSelection) {
              // 执行一个轻微的操作来触发视图更新，但保持相同的选区
              const point = { ...currentSelection.anchor };
              const focus = currentSelection.focus ? { ...currentSelection.focus } : point;
              Transforms.select(editor, { anchor: point, focus });
            }
          }
        } catch (error) {
          console.error('更新代码高亮出错:', error);
        }
      });
      
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

      // 处理Markdown快捷方式
      const beforeMatch = checkMarkdownShortcut(beforeText)
      if (beforeMatch) {
        // 不处理```，让它通过回车键处理
        if (beforeMatch[1] === '```') {
          insertText(text)
          return
        }
        
        // 删除Markdown标记文本
        Transforms.select(editor, range)
        Transforms.delete(editor)

        // 根据Markdown标记应用格式
        const type = beforeMatch[1] // 提取匹配的类型，如 #, ##, >, -, *, + 等
        
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
              { type: 'bulleted-list', children: [] } as CustomElement,
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
              { type: 'numbered-list', children: [] } as CustomElement,
              { match: n => SlateElement.isElement(n) && (n as CustomElement).type === 'list-item' }
            )
            break
        }
        return
      }
    }

    // 如果没有匹配Markdown语法，执行默认插入文本操作
    insertText(text)
  }

  // 自定义 deleteBackward 处理
  editor.deleteBackward = unit => {
    const { selection } = editor
    
    if (selection && SlateRange.isCollapsed(selection)) {
      const [codeBlock] = Editor.nodes(editor, {
        match: n => SlateElement.isElement(n) && (n as CustomElement).type === 'code-block',
      })
      
      if (codeBlock) {
        const [node, path] = codeBlock
        const start = Editor.start(editor, path)
        
        // 检查是否在代码块的开始位置
        const isAtStart = Point.equals(selection.anchor, start)
        
        // 获取代码块内容
        const text = Node.string(node)
        
        // 如果代码块为空，或者在起始位置，则转换为段落
        if (isAtStart || text.trim() === '') {
          // 在代码块起始位置按退格键时，转换为段落
          Transforms.setNodes(
            editor,
            { type: 'paragraph' },
            { match: n => SlateElement.isElement(n) && (n as CustomElement).type === 'code-block' }
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