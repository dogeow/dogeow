"use client"

import { useState, useEffect } from 'react'
import { apiRequest } from '@/lib/api'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Save, Loader2, Lock, Unlock } from 'lucide-react'

// 使用dynamic import避免服务端渲染问题
const TailwindAdvancedEditor = dynamic(
  () => import('@/components/novel-editor'),
  { ssr: false }
)

interface Note {
  id: number
  title: string
  content: string
  content_markdown: string
  is_draft: boolean
}

// 笔记编辑页面
export default function EditNotePage() {
  const { id } = useParams()
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clientReady, setClientReady] = useState(false)
  const [title, setTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  
  // 添加按钮交互状态
  const [draftButtonHovered, setDraftButtonHovered] = useState(false)
  const [saveButtonHovered, setSaveButtonHovered] = useState(false)
  const [draftButtonPressed, setDraftButtonPressed] = useState(false)
  const [saveButtonPressed, setSaveButtonPressed] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false) // 草稿保存状态

  useEffect(() => {
    // 标记客户端组件已加载
    setClientReady(true)

    const fetchNote = async () => {
      try {
        const noteId = Array.isArray(id) ? id[0] : id
        const data = await apiRequest<Note>(`/notes/${noteId}`)
        setNote(data)
        setTitle(data.title)
        
        // 将笔记内容加载到 Novel 编辑器
        if (data.content) {
          try {
            // 尝试解析内容，如果是有效的JSON则使用，否则创建默认内容
            const parsedContent = JSON.parse(data.content)
            window.localStorage.setItem("novel-content", JSON.stringify(parsedContent))
          } catch {
            // 如果内容不是有效的JSON，创建包含文本的默认结构
            const defaultContent = {
              "type": "doc",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": data.content || ""
                    }
                  ]
                }
              ]
            }
            window.localStorage.setItem("novel-content", JSON.stringify(defaultContent))
          }
        }
        
        // 同时设置 markdown 内容
        if (data.content_markdown) {
          window.localStorage.setItem("markdown", data.content_markdown)
        }
        
      } catch (err) {
        console.error('获取笔记失败', err)
        setError('无法加载笔记，请重试')
      } finally {
        setLoading(false)
      }
    }

    fetchNote()
  }, [id])

  // 获取当前编辑器内容和markdown
  const getCurrentContent = () => {
    const content = window.localStorage.getItem("novel-content")
    const markdown = window.localStorage.getItem("markdown")
    return {
      content: content || '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":""}]}]}',
      markdown: markdown || ''
    }
  }

  // 保存笔记
  const handleSave = async (asDraft = false) => {
    if (!title.trim()) {
      toast.error('请输入笔记标题')
      return
    }

    const { content, markdown } = getCurrentContent()
    
    try {
      setIsSaving(true)
      
      const data = {
        title: title.trim(),
        content,
        content_markdown: markdown,
        is_draft: asDraft
      }

      const noteId = Array.isArray(id) ? id[0] : id
      const result = await apiRequest<Note>(`/notes/${noteId}`, 'PUT', data)
      
      toast.success(asDraft ? '已解锁' : '笔记已更新')
      
      // 如果是草稿，设置草稿保存状态
      if (asDraft) {
        setDraftSaved(true)
      }
      
    } catch (error) {
      console.error('保存笔记错误:', error)
      toast.error('保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  // 添加快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S 或 Cmd+S 保存
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (title.trim() && !isSaving) {
          handleSave(false)
        }
      }
      // Ctrl+Shift+S 或 Cmd+Shift+S 保存草稿
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault()
        if (title.trim() && !isSaving) {
          handleSave(true)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [title, isSaving])

  if (loading) {
    return (
      <div className="container mx-auto py-4">
        <div className="animate-pulse">
          <div className="h-8 w-1/3 mb-4 bg-gray-200 rounded"></div>
          <div className="h-64 w-full bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    )
  }

  if (!note) {
    return (
      <div className="container mx-auto py-4">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          找不到笔记
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-4">
      <div className="flex justify-center">
        <div className="w-full max-w-screen-lg">
          {/* 标题输入框 */}
          <div className="mb-4 flex items-center gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入笔记标题"
              className="text-lg font-medium flex-1"
            />
            <Button 
              onClick={() => handleSave(true)}
              onMouseEnter={() => setDraftButtonHovered(true)}
              onMouseLeave={() => setDraftButtonHovered(false)}
              onMouseDown={() => setDraftButtonPressed(true)}
              onMouseUp={() => setDraftButtonPressed(false)}
              variant="ghost"
              size="icon"
              disabled={isSaving || !title.trim()}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
              title="上锁保存 (Ctrl+Shift+S)"
              style={{
                transform: `translateY(${draftButtonHovered ? '-2px' : '0'}) scale(${draftButtonPressed ? '0.95' : '1'})`,
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: draftButtonHovered ? '0 4px 8px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : (draftSaved ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />)}
            </Button>
            <Button 
              onClick={() => handleSave(false)}
              onMouseEnter={() => setSaveButtonHovered(true)}
              onMouseLeave={() => setSaveButtonHovered(false)}
              onMouseDown={() => setSaveButtonPressed(true)}
              onMouseUp={() => setSaveButtonPressed(false)}
              size="icon"
              disabled={isSaving || !title.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              title="保存 (Ctrl+S)"
              style={{
                transform: `translateY(${saveButtonHovered ? '-2px' : '0'}) scale(${saveButtonPressed ? '0.95' : '1'})`,
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: saveButtonHovered ? '0 6px 12px rgba(0,0,0,0.15)' : 'none'
              }}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
          </div>
          
          {/* Novel 编辑器 */}
          {clientReady && <TailwindAdvancedEditor />}
        </div>
      </div>
    </div>
  )
} 