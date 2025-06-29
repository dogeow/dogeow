"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { apiRequest } from '@/lib/api'
import { Save, Send, Loader2, Lock, Unlock } from 'lucide-react'

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

export default function NewNotePage() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
  const [title, setTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  
  // 添加按钮交互状态
  const [draftButtonHovered, setDraftButtonHovered] = useState(false)
  const [publishButtonHovered, setPublishButtonHovered] = useState(false)
  const [draftButtonPressed, setDraftButtonPressed] = useState(false)
  const [publishButtonPressed, setPublishButtonPressed] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false) // 草稿保存状态

  // 在客户端组件挂载后设置为已加载
  useEffect(() => {
    setIsLoaded(true)
  }, [])

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

      const result = await apiRequest<Note>('/notes', 'POST', data)
      
      toast.success(asDraft ? '已解锁' : '笔记已创建')
      
      // 如果是草稿，设置草稿保存状态
      if (asDraft) {
        setDraftSaved(true)
      }
      
      // 清除本地存储的内容
      window.localStorage.removeItem("novel-content")
      window.localStorage.removeItem("html-content")
      window.localStorage.removeItem("markdown")
      
      // 跳转到编辑页面
      router.push(`/note/edit/${result.id}`)
      
    } catch (error) {
      console.error('保存笔记错误:', error)
      toast.error('保存失败')
    } finally {
      setIsSaving(false)
    }
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
              onMouseEnter={() => setPublishButtonHovered(true)}
              onMouseLeave={() => setPublishButtonHovered(false)}
              onMouseDown={() => setPublishButtonPressed(true)}
              onMouseUp={() => setPublishButtonPressed(false)}
              size="icon"
              disabled={isSaving || !title.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              title="发布 (Ctrl+S)"
              style={{
                transform: `translateY(${publishButtonHovered ? '-2px' : '0'}) scale(${publishButtonPressed ? '0.95' : '1'})`,
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: publishButtonHovered ? '0 6px 12px rgba(0,0,0,0.15)' : 'none'
              }}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
          </div>
          
          {/* Novel 编辑器 */}
          {isLoaded && <TailwindAdvancedEditor />}
        </div>
      </div>
    </div>
  )
} 