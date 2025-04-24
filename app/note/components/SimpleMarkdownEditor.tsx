"use client"

import React, { useEffect, useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Bold, Italic, List, ListOrdered, Code, Save, FileText, Link as LinkIcon, Quote, Heading1, Heading2, Columns } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { put } from '@/utils/api'

interface SimpleMarkdownEditorProps {
  noteId: number
  initialContent?: string
}

// 编辑器模式类型
type EditorMode = 'edit' | 'preview' | 'split'

const SimpleMarkdownEditor = ({ noteId, initialContent = '' }: SimpleMarkdownEditorProps) => {
  const [content, setContent] = useState(initialContent || '')
  const [editorMode, setEditorMode] = useState<EditorMode>('edit')
  const [loading, setLoading] = useState(false)
  
  // 初始化编辑器
  useEffect(() => {
    if (initialContent) {
      setContent(initialContent)
    }
  }, [initialContent])

  // 保存笔记
  const saveNote = useCallback(async () => {
    if (!noteId) {
      toast.error('笔记ID无效')
      return
    }
    
    setLoading(true)
    
    try {
      await put(`/notes/${noteId}`, {
        content: content
      })
      
      toast.success('笔记已保存')
    } catch (error) {
      console.error('保存笔记失败:', error)
      toast.error('保存笔记失败')
    } finally {
      setLoading(false)
    }
  }, [content, noteId])

  // 切换编辑器模式
  const toggleEditorMode = useCallback((mode: EditorMode) => {
    setEditorMode(mode)
  }, [])
  
  // 处理输入，实现简单的Markdown快捷方式
  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setContent(value)
    
    // 检测新行的Markdown快捷方式
    const lastNewLineIndex = value.lastIndexOf('\n')
    if (lastNewLineIndex !== -1) {
      const lastLine = value.substring(lastNewLineIndex + 1)
      
      // 检查是否刚输入了一个空格，且前面可能是Markdown标记
      if (lastLine.endsWith(' ') && lastLine.length > 1) {
        const checkForShortcut = lastLine.trim()
        
        let newContent = value
        
        // 处理各种Markdown快捷方式
        if (checkForShortcut === '#') {
          // 替换为标准的一级标题格式
          newContent = value.slice(0, -1) + ' '
        } 
        else if (checkForShortcut === '##') {
          // 替换为标准的二级标题格式
          newContent = value.slice(0, -1) + ' '
        }
        else if (checkForShortcut === '###') {
          // 替换为标准的三级标题格式
          newContent = value.slice(0, -1) + ' '
        }
        else if (checkForShortcut === '>') {
          // 替换为标准的引用格式
          newContent = value.slice(0, -1) + ' '
        }
        
        // 如果内容被修改，更新状态
        if (newContent !== value) {
          setContent(newContent)
        }
      }
    }
  }, [])
  
  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    const { value, selectionStart } = textarea
    
    // 处理回车键：继续列表
    if (e.key === 'Enter' && !e.shiftKey) {
      // 获取当前行
      const textBeforeCursor = value.substring(0, selectionStart)
      const lastNewLineIndex = textBeforeCursor.lastIndexOf('\n')
      const currentLine = textBeforeCursor.substring(lastNewLineIndex + 1)
      
      // 无序列表匹配
      const unorderedListMatch = /^([-*+]\s)(.*)$/.exec(currentLine)
      if (unorderedListMatch) {
        // 如果是空的列表项，结束列表
        if (unorderedListMatch[2].trim() === '') {
          e.preventDefault()
          const newContent = 
            value.substring(0, selectionStart - unorderedListMatch[1].length) + 
            '\n' + 
            value.substring(selectionStart)
          setContent(newContent)
          
          // 设置光标位置
          setTimeout(() => {
            const newPosition = selectionStart - unorderedListMatch[1].length + 1
            textarea.selectionStart = textarea.selectionEnd = newPosition
          }, 0)
          return
        }
        
        // 继续列表
        e.preventDefault()
        const newContent = 
          value.substring(0, selectionStart) + 
          '\n' + unorderedListMatch[1] + 
          value.substring(selectionStart)
        setContent(newContent)
        
        // 设置光标位置
        setTimeout(() => {
          const newPosition = selectionStart + 1 + unorderedListMatch[1].length
          textarea.selectionStart = textarea.selectionEnd = newPosition
        }, 0)
        return
      }
      
      // 有序列表匹配
      const orderedListMatch = /^(\d+)(\.\s)(.*)$/.exec(currentLine)
      if (orderedListMatch) {
        // 如果是空的列表项，结束列表
        if (orderedListMatch[3].trim() === '') {
          e.preventDefault()
          const newContent = 
            value.substring(0, selectionStart - (orderedListMatch[1].length + orderedListMatch[2].length)) + 
            '\n' + 
            value.substring(selectionStart)
          setContent(newContent)
          
          // 设置光标位置
          setTimeout(() => {
            const newPosition = selectionStart - (orderedListMatch[1].length + orderedListMatch[2].length) + 1
            textarea.selectionStart = textarea.selectionEnd = newPosition
          }, 0)
          return
        }
        
        // 继续列表，数字加1
        const nextNumber = parseInt(orderedListMatch[1]) + 1
        e.preventDefault()
        const newContent = 
          value.substring(0, selectionStart) + 
          '\n' + nextNumber + orderedListMatch[2] + 
          value.substring(selectionStart)
        setContent(newContent)
        
        // 设置光标位置
        setTimeout(() => {
          const newPosition = selectionStart + 1 + String(nextNumber).length + orderedListMatch[2].length
          textarea.selectionStart = textarea.selectionEnd = newPosition
        }, 0)
        return
      }
    }
    
    // 处理Tab键：增加缩进
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault()
      const newContent = 
        value.substring(0, selectionStart) + 
        '  ' + 
        value.substring(selectionStart)
      setContent(newContent)
      
      // 设置光标位置
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 2
      }, 0)
      return
    }
  }, [])
  
  // 插入格式化文本
  const insertFormat = useCallback((format: string) => {
    const textarea = document.getElementById('markdown-editor') as HTMLTextAreaElement
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    
    let formattedText = ''
    let cursorOffset = 0
    
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`
        cursorOffset = 2
        break
      case 'italic':
        formattedText = `*${selectedText}*`
        cursorOffset = 1
        break
      case 'code':
        formattedText = `\`${selectedText}\``
        cursorOffset = 1
        break
      case 'list':
        formattedText = selectedText
          ? selectedText.split('\n').map(line => `- ${line}`).join('\n')
          : '- '
        break
      case 'ordered-list':
        formattedText = selectedText
          ? selectedText.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n')
          : '1. '
        break
      case 'link':
        const url = prompt('输入链接地址:') || 'https://'
        formattedText = selectedText ? `[${selectedText}](${url})` : `[链接文本](${url})`
        break
      case 'heading1':
        formattedText = selectedText ? `# ${selectedText}` : '# '
        break
      case 'heading2':
        formattedText = selectedText ? `## ${selectedText}` : '## '
        break
      case 'blockquote':
        formattedText = selectedText
          ? selectedText.split('\n').map(line => `> ${line}`).join('\n')
          : '> '
        break
      default:
        formattedText = selectedText
    }
    
    const newContent = content.substring(0, start) + formattedText + content.substring(end)
    setContent(newContent)
    
    // 重新设置选择区域，方便继续编辑
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = selectedText ? start + formattedText.length : start + formattedText.length - cursorOffset
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }, [content])
  
  // 渲染Markdown
  const renderMarkdown = useCallback((markdown: string) => {
    // 更完善的Markdown渲染
    let html = markdown
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      
    // 改进列表渲染
    // 将无序列表项包装在ul中
    const lines = html.split('\n');
    let inList = false;
    let listType = "";
    
    for (let i = 0; i < lines.length; i++) {
      // 无序列表
      if (lines[i].match(/^- (.+)$/)) {
        lines[i] = lines[i].replace(/^- (.+)$/, '<li>$1</li>');
        
        if (!inList || listType !== "ul") {
          lines[i] = '<ul>' + lines[i];
          inList = true;
          listType = "ul";
        }
      } 
      // 有序列表
      else if (lines[i].match(/^(\d+)\. (.+)$/)) {
        lines[i] = lines[i].replace(/^(\d+)\. (.+)$/, '<li>$2</li>');
        
        if (!inList || listType !== "ol") {
          lines[i] = '<ol>' + lines[i];
          inList = true;
          listType = "ol";
        }
      } 
      // 非列表行，关闭之前的列表
      else if (inList) {
        lines[i-1] = lines[i-1] + (listType === "ul" ? '</ul>' : '</ol>');
        inList = false;
        listType = "";
      }
    }
    
    // 确保最后一个列表被关闭
    if (inList) {
      lines.push(listType === "ul" ? '</ul>' : '</ol>');
    }
    
    html = lines.join('\n');
    
    // 处理段落和空行
    html = html
      .replace(/^(?!<[hl]|<li|<\/|<code|<strong|<em|<a|<ul|<ol|<blockquote).+$/gm, '<p>$&</p>')
      .replace(/\n\n/g, '<br/>');
      
    return html;
  }, [])
  
  // 渲染编辑器内容
  const renderEditor = () => {
    const textarea = (
      <textarea
        id="markdown-editor"
        className="w-full min-h-[400px] p-4 focus:outline-none resize-none font-mono text-base leading-normal whitespace-pre-wrap"
        value={content}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="开始输入 Markdown 内容...

快捷方式提示:
- 输入 # 空格 创建一级标题
- 输入 ## 空格 创建二级标题
- 输入 > 空格 创建引用块
- 输入 - 空格 创建无序列表
- 输入 1. 空格 创建有序列表
- 空列表项回车结束列表"
        spellCheck={false}
        style={{ 
          lineHeight: '1.5',
          fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
        }}
      />
    );

    const preview = (
      <div 
        className="p-4 min-h-[400px] bg-white dark:bg-black prose dark:prose-invert max-w-none overflow-auto"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />
    );

    switch (editorMode) {
      case 'edit':
        return textarea;
      case 'preview':
        return preview;
      case 'split':
        return (
          <div className="flex flex-row divide-x">
            <div className="w-1/2">{textarea}</div>
            <div className="w-1/2">{preview}</div>
          </div>
        );
    }
  };
  
  return (
    <div className="flex flex-col space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted/30 p-2 border-b flex flex-wrap gap-1">
          {editorMode !== 'preview' && (
            <>
              <Button 
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => insertFormat('heading1')}
                title="标题1"
                className="h-9 w-9"
              >
                <Heading1 className="h-5 w-5" />
              </Button>
              
              <Button 
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => insertFormat('heading2')}
                title="标题2"
                className="h-9 w-9"
              >
                <Heading2 className="h-5 w-5" />
              </Button>
              
              <Button 
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => insertFormat('blockquote')}
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
                onClick={() => insertFormat('bold')}
                title="加粗"
                className="h-9 w-9"
              >
                <Bold className="h-5 w-5" />
              </Button>
              
              <Button 
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => insertFormat('italic')}
                title="斜体"
                className="h-9 w-9"
              >
                <Italic className="h-5 w-5" />
              </Button>
              
              <Button 
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => insertFormat('code')}
                title="代码"
                className="h-9 w-9"
              >
                <Code className="h-5 w-5" />
              </Button>
              
              <div className="w-px h-8 bg-border mx-1"></div>
              
              <Button 
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => insertFormat('list')}
                title="无序列表"
                className="h-9 w-9"
              >
                <List className="h-5 w-5" />
              </Button>
              
              <Button 
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => insertFormat('ordered-list')}
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
                onClick={() => insertFormat('link')}
                title="插入链接"
                className="h-9 w-9"
              >
                <LinkIcon className="h-5 w-5" />
              </Button>
            </>
          )}

          <div className="ml-auto flex items-center gap-1">
            <div className="flex rounded-md border border-input overflow-hidden">
              <Button 
                variant={editorMode === 'edit' ? "secondary" : "ghost"}
                size="sm" 
                onClick={() => toggleEditorMode('edit')}
                className="rounded-none border-0 px-3"
              >
                编辑
              </Button>
              
              <Button 
                variant={editorMode === 'preview' ? "secondary" : "ghost"}
                size="sm" 
                onClick={() => toggleEditorMode('preview')}
                className="rounded-none border-0 border-x border-input px-3"
              >
                预览
              </Button>
              
              <Button 
                variant={editorMode === 'split' ? "secondary" : "ghost"}
                size="sm" 
                onClick={() => toggleEditorMode('split')}
                title="双栏模式"
                className="rounded-none border-0 px-3"
              >
                <Columns className="h-4 w-4" />
              </Button>
            </div>
            
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
          {renderEditor()}
        </div>
      </div>
    </div>
  )
}

export default SimpleMarkdownEditor 