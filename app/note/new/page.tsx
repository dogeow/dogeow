'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { apiRequest } from '@/lib/api'
import { Save, Loader2, Lock, Unlock } from 'lucide-react'

// 使用dynamic import避免服务端渲染问题
const TailwindAdvancedEditor = dynamic(() => import('@/components/novel-editor'), { ssr: false })

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
  const [isPrivate, setIsPrivate] = useState(false) // 隐私状态

  // 添加按钮交互状态
  const [privacyButtonHovered, setPrivacyButtonHovered] = useState(false)
  const [saveButtonHovered, setSaveButtonHovered] = useState(false)
  const [privacyButtonPressed, setPrivacyButtonPressed] = useState(false)
  const [saveButtonPressed, setSaveButtonPressed] = useState(false)

  // 在客户端组件挂载后设置为已加载，并清空编辑器内容
  useEffect(() => {
    // 清空之前的编辑器内容，确保新建笔记是空的
    window.localStorage.removeItem('novel-content')
    window.localStorage.removeItem('html-content')
    window.localStorage.removeItem('markdown')

    setIsLoaded(true)
  }, [])

  // 获取当前编辑器内容和markdown
  const getCurrentContent = () => {
    const content = window.localStorage.getItem('novel-content')
    const markdown = window.localStorage.getItem('markdown')
    return {
      content:
        content ||
        '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":""}]}]}',
      markdown: markdown || '',
    }
  }

  // 切换隐私状态
  const handleTogglePrivacy = useCallback(() => {
    setIsPrivate(!isPrivate)
  }, [isPrivate])

  // 保存笔记
  const handleSave = useCallback(async () => {
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
        is_draft: isPrivate, // 私密状态对应 is_draft
      }

      const result = await apiRequest<Note>('/notes', 'POST', data)

      toast.success('笔记已创建')

      // 清除本地存储的内容
      window.localStorage.removeItem('novel-content')
      window.localStorage.removeItem('html-content')
      window.localStorage.removeItem('markdown')

      // 跳转到编辑页面
      router.push(`/note/edit/${result.id}`)
    } catch (error) {
      console.error('保存笔记错误:', error)
      toast.error('保存失败')
    } finally {
      setIsSaving(false)
    }
  }, [title, router, isPrivate])

  // 添加快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S 或 Cmd+S 保存
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (title.trim() && !isSaving) {
          handleSave()
        }
      }
      // Ctrl+Shift+P 或 Cmd+Shift+P 切换隐私状态
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        if (title.trim() && !isSaving) {
          handleTogglePrivacy()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [title, isSaving, handleSave, handleTogglePrivacy])

  return (
    <div className="container mx-auto py-4">
      <div className="flex justify-center">
        <div className="w-full max-w-screen-lg">
          {/* 标题输入框 */}
          <div className="mb-4 flex items-center gap-2">
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="请输入笔记标题"
              className="flex-1 text-lg font-medium"
            />
            <Button
              onClick={handleTogglePrivacy}
              onMouseEnter={() => setPrivacyButtonHovered(true)}
              onMouseLeave={() => setPrivacyButtonHovered(false)}
              onMouseDown={() => setPrivacyButtonPressed(true)}
              onMouseUp={() => setPrivacyButtonPressed(false)}
              variant="ghost"
              size="icon"
              disabled={isSaving || !title.trim()}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
              title={`${isPrivate ? '切换为公开' : '切换为私密'} (Ctrl+Shift+P)`}
              style={{
                transform: `translateY(${privacyButtonHovered ? '-2px' : '0'}) scale(${privacyButtonPressed ? '0.95' : '1'})`,
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: privacyButtonHovered ? '0 4px 8px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isPrivate ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
            </Button>
            <Button
              onClick={handleSave}
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
                boxShadow: saveButtonHovered ? '0 6px 12px rgba(0,0,0,0.15)' : 'none',
              }}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* 隐私状态提示 */}
          <div className="text-muted-foreground mb-4 text-center text-sm">
            {isPrivate ? '已私密' : '已公开'}
          </div>

          {/* Novel 编辑器 */}
          {isLoaded && <TailwindAdvancedEditor />}
        </div>
      </div>
    </div>
  )
}
