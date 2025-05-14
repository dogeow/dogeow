"use client"

import React, { useState, useCallback, useEffect } from 'react'
import { Descendant, Editor, Transforms, Range, Node, Element as SlateElement, Text } from 'slate'
import { Slate, Editable } from 'slate-react'
import isHotkey from 'is-hotkey'
import { toast } from 'react-hot-toast'
import { put } from '@/utils/api'

import { HOTKEYS, initialValue as defaultInitialValue, CustomElement, CustomText } from '../types/editor'
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

  // 检查某个节点是否处于代码格式中
  const isInCode = useCallback((editor: Editor) => {
    const marks = Editor.marks(editor)
    return marks ? !!marks.code : false
  }, [])

  // 手动处理行内代码 - 查找文本中的行内代码模式并应用格式
  const processInlineCode = useCallback(() => {
    // 获取当前选中的节点
    const { selection } = editor
    if (!selection) return
    
    // 如果当前已经在代码模式下，不进行处理
    const marks = Editor.marks(editor)
    if (marks && marks.code) return
    
    // 遍历文档，查找包含 `text` 格式的文本
    const inlineCodePattern = /`([^`]+)`/g
    
    // 处理当前段落及相邻段落
    const currentPath = selection.anchor.path.slice(0, 1)
    
    // 获取当前段落文本
    try {
      const [node] = Editor.node(editor, currentPath)
      
      if (!node || !SlateElement.isElement(node) || !node.children) return
      
      // 将段落文本转换为纯文本以便于搜索
      const blockText = node.children
        .map(child => Text.isText(child) ? child.text : '')
        .join('')
      
      // 搜索行内代码模式
      let match
      const matches = []
      while ((match = inlineCodePattern.exec(blockText)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          content: match[1]
        })
      }
      
      if (matches.length === 0) return
      
      // 从后向前处理，避免位置偏移问题
      for (let i = matches.length - 1; i >= 0; i--) {
        const { start, end, content } = matches[i]
        
        // 查找对应的文本节点和偏移
        let currentOffset = 0
        let startPath = null
        let startOffset = 0
        let endPath = null
        let endOffset = 0
        
        for (let j = 0; j < node.children.length; j++) {
          const child = node.children[j]
          if (!Text.isText(child)) continue
          
          const textLength = child.text.length
          
          // 检查开始位置
          if (startPath === null && currentOffset + textLength > start) {
            startPath = [...currentPath, j]
            startOffset = start - currentOffset
          }
          
          // 检查结束位置
          if (currentOffset + textLength >= end) {
            endPath = [...currentPath, j]
            endOffset = end - currentOffset
            break
          }
          
          currentOffset += textLength
        }
        
        if (startPath && endPath) {
          // 检查是否已经有代码标记
          let hasCodeMark = false
          const range = {
            anchor: { path: startPath, offset: startOffset },
            focus: { path: endPath, offset: endOffset }
          }
          
          // 查找范围内的节点是否已有代码标记
          for (const [node] of Editor.nodes(editor, { at: range, match: n => Text.isText(n) })) {
            if (Text.isText(node) && node.code) {
              hasCodeMark = true
              break
            }
          }
          
          if (!hasCodeMark) {
            // 选择包含行内代码的文本
            Transforms.select(editor, range)
            
            // 删除原始文本（包括反引号）
            Transforms.delete(editor)
            
            // 插入带有代码格式的文本
            Transforms.insertNodes(editor, {
              text: content,
              code: true
            })
          }
        }
      }
      
      // 重置选择回原始位置
      if (selection && Range.isCollapsed(selection)) {
        Transforms.select(editor, selection)
      }
    } catch (err) {
      console.error('处理行内代码错误:', err)
    }
  }, [editor])

  // 定期处理行内代码
  useEffect(() => {
    const interval = setInterval(() => {
      processInlineCode()
    }, 2000) // 每2秒检查一次
    
    return () => clearInterval(interval)
  }, [processInlineCode])

  // 处理编辑器的键盘快捷键
  const handleKeyDown = (event: React.KeyboardEvent) => {
    // 当按下回车键且在代码标记中时，保持代码标记
    if (event.key === 'Enter' && isInCode(editor)) {
      event.preventDefault()
      
      // 插入新行并保持代码标记
      Editor.insertText(editor, '\n')
      return
    }

    // 当用户输入反引号时尝试处理行内代码
    if (event.key === '`') {
      // 等待DOM更新后再处理
      setTimeout(() => {
        processInlineCode()
      }, 10)
    }
    
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