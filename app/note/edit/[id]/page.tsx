'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiRequest } from '@/lib/api'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
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

// 笔记编辑页面
export default function EditNotePage() {
  const { id } = useParams()
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clientReady, setClientReady] = useState(false)
  const [title, setTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false) // 隐私状态

  // 添加按钮交互状态
  const [privacyButtonHovered, setPrivacyButtonHovered] = useState(false)
  const [saveButtonHovered, setSaveButtonHovered] = useState(false)
  const [privacyButtonPressed, setPrivacyButtonPressed] = useState(false)
  const [saveButtonPressed, setSaveButtonPressed] = useState(false)

  useEffect(() => {
    // 标记客户端组件已加载
    setClientReady(true)

    const fetchNote = async () => {
      try {
        const noteId = Array.isArray(id) ? id[0] : id
        const data = await apiRequest<Note>(`/notes/${noteId}`)
        setNote(data)
        setTitle(data.title)
        setIsPrivate(data.is_draft) // 设置初始隐私状态

        // 将笔记内容加载到 Novel 编辑器
        if (data.content) {
          try {
            // 尝试解析内容，如果是有效的JSON则使用，否则创建默认内容
            const parsedContent = JSON.parse(data.content)
            window.localStorage.setItem('novel-content', JSON.stringify(parsedContent))
          } catch {
            // 如果内容不是有效的JSON，创建包含文本的默认结构
            const defaultContent = {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: data.content || '',
                    },
                  ],
                },
              ],
            }
            window.localStorage.setItem('novel-content', JSON.stringify(defaultContent))
          }
        }

        // 同时设置 markdown 内容
        if (data.content_markdown) {
          window.localStorage.setItem('markdown', data.content_markdown)
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
  const handleTogglePrivacy = useCallback(async () => {
    if (!title.trim()) {
      toast.error('请输入笔记标题')
      return
    }

    const { content, markdown } = getCurrentContent()
    const newPrivacyStatus = !isPrivate

    try {
      setIsSaving(true)

      const data = {
        title: title.trim(),
        content,
        content_markdown: markdown,
        is_draft: newPrivacyStatus, // 私密状态对应 is_draft
      }

      const noteId = Array.isArray(id) ? id[0] : id
      await apiRequest<Note>(`/notes/${noteId}`, 'PUT', data)

      setIsPrivate(newPrivacyStatus)
      toast.success(newPrivacyStatus ? '已私密' : '已公开')
    } catch (error) {
      console.error('切换隐私状态错误:', error)
      toast.error('操作失败')
    } finally {
      setIsSaving(false)
    }
  }, [title, id, isPrivate])

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
        is_draft: isPrivate, // 保持当前隐私状态
      }

      const noteId = Array.isArray(id) ? id[0] : id
      await apiRequest<Note>(`/notes/${noteId}`, 'PUT', data)

      toast.success('笔记已更新')
    } catch (error) {
      console.error('保存笔记错误:', error)
      toast.error('保存失败')
    } finally {
      setIsSaving(false)
    }
  }, [title, id, isPrivate])

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

  if (loading) {
    return (
      <div className="container mx-auto py-4">
        <div className="animate-pulse">
          <div className="mb-4 h-8 w-1/3 rounded bg-gray-200"></div>
          <div className="h-64 w-full rounded bg-gray-200"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-4">
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      </div>
    )
  }

  if (!note) {
    return (
      <div className="container mx-auto py-4">
        <div className="rounded border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-700">
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

          {/* Novel 编辑器 */}
          {clientReady && <TailwindAdvancedEditor />}
        </div>
      </div>
    </div>
  )
}
