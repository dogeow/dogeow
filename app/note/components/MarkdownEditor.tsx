"use client"

import React, { useState, useCallback, useEffect } from 'react'
import { Descendant, Editor, Transforms, Range } from 'slate'
import { Slate, Editable } from 'slate-react'
import isHotkey from 'is-hotkey'
import { toast } from 'react-hot-toast'
import { put } from '@/utils/api'

import { HOTKEYS, initialValue as defaultInitialValue, CustomElement } from '../types/editor'
import { deserialize, serialize } from '../utils/markdown'
import Element from './editor/Element'
import Leaf from './editor/Leaf'
import EditorToolbar from './editor/EditorToolbar'
import LinkDialog from './editor/LinkDialog'
import useSlateEditor from '../hooks/useSlateEditor'

// 主编辑器组件
interface MarkdownEditorProps {
  noteId: number;
  initialContent?: string;
}

const MarkdownEditor = ({ noteId, initialContent }: MarkdownEditorProps) => {
  const [value, setValue] = useState<Descendant[]>(defaultInitialValue as Descendant[])
  const [markdownValue, setMarkdownValue] = useState(initialContent || '')
  const [currentNoteId, setCurrentNoteId] = useState<number | null>(noteId)
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [loading, setLoading] = useState(false)
  
  const editor = useSlateEditor()

  // 初始化编辑器
  useEffect(() => {
    if (initialContent) {
      try {
        setValue(deserialize(initialContent))
      } catch (error) {
        console.error('解析笔记内容失败:', error)
        setValue(defaultInitialValue as Descendant[])
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
              if ('text' in firstNode) {
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
            { type: 'table-cell', children: [{ text: '列1' }] } as CustomElement,
            { type: 'table-cell', children: [{ text: '列2' }] } as CustomElement
          ]
        } as CustomElement,
        {
          type: 'table-row',
          children: [
            { type: 'table-cell', children: [{ text: '' }] } as CustomElement,
            { type: 'table-cell', children: [{ text: '' }] } as CustomElement
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
        <Slate
          editor={editor}
          initialValue={value}
          onChange={newValue => setValue(newValue)}
        >
          <EditorToolbar 
            onSave={saveNote}
            onLinkDialogOpen={() => setIsLinkDialogOpen(true)}
            onInsertCodeBlock={insertCodeBlock}
            onInsertTable={insertTable}
            isSaving={loading}
            disabled={!currentNoteId}
          />
          
          <Editable
            className="p-4 min-h-[400px] focus:outline-none"
            renderElement={props => <Element {...props} />}
            renderLeaf={props => <Leaf {...props} />}
            spellCheck={false}
            autoFocus
            onKeyDown={handleKeyDown}
          />
        </Slate>
      </div>
      
      {/* 链接对话框 */}
      <LinkDialog 
        isOpen={isLinkDialogOpen}
        onOpenChange={setIsLinkDialogOpen}
        linkText={linkText}
        setLinkText={setLinkText}
        linkUrl={linkUrl}
        setLinkUrl={setLinkUrl}
        onInsert={insertLink}
      />
    </div>
  )
}

export default MarkdownEditor 