import React from 'react'
import { Editor, Element as SlateElement, Transforms } from 'slate'
import { useSlate } from 'slate-react'
import { Button } from "@/components/ui/button"
import { LIST_TYPES, CustomElement } from '../../types/editor'

interface ToolbarButtonProps {
  format: string
  icon: React.ElementType
  tooltip: string
}

const ToolbarButton = ({ format, icon: Icon, tooltip }: ToolbarButtonProps) => {
  const editor = useSlate()

  const isBlockActive = (editor: Editor, format: string) => {
    const [match] = Editor.nodes(editor, {
      match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
    })
    return !!match
  }

  const isMarkActive = (editor: Editor, format: string) => {
    const marks = Editor.marks(editor)
    return marks ? marks[format as keyof typeof marks] === true : false
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
    
    // 日志输出，帮助调试
    console.log(`Toggling mark: ${format}, current active: ${isActive}`)
    
    if (isActive) {
      Editor.removeMark(editor, format)
    } else {
      // 确保在激活code标记前，选择区域非空
      if (format === 'code' && editor.selection && !editor.selection.anchor.offset && !editor.selection.focus.offset) {
        // 如果没有选中文本，插入一个占位符并选中它
        Editor.insertText(editor, 'code')
        Transforms.select(editor, {
          anchor: Editor.before(editor, editor.selection.anchor, { unit: 'character' }) || editor.selection.anchor,
          focus: editor.selection.focus
        })
      }
      
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

export default ToolbarButton 