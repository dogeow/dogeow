"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { apiRequest } from '@/lib/api'
import MarkdownEditor from '@/components/markdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useEditorStore } from '../store/editorStore'
import { useGlobalNavigationGuard } from '../hooks/useGlobalNavigationGuard'

interface NoteEditorProps {
  noteId?: number
  title?: string
  content?: string
  isEditing?: boolean
  initialMarkdown?: string
  isDraft?: boolean
}

interface Note {
  id: number
  title: string
  content: string
  content_markdown: string
  is_draft: boolean
}

interface UploadResult {
  url: string
  path: string
}

// 工具函数：判断字符串是否为合法的 Slate JSON
function isValidSlateJson(str: string) {
  try {
    const val = JSON.parse(str)
    return Array.isArray(val) && val.every(item => item.type && item.children)
  } catch {
    return false
  }
}

export default function NoteEditor({ 
  noteId, 
  title = '', 
  content = '', 
  isEditing = false,
  initialMarkdown = '',
  isDraft = false
}: NoteEditorProps) {
  const router = useRouter()
  const [noteTitle, setNoteTitle] = useState(title)
  const [, setIsSaving] = useState(false)
  const [, setMarkdownPreview] = useState(initialMarkdown)
  const [draft, setDraft] = useState(isDraft)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  const { setDirty, setSaveDraft } = useEditorStore()
  const [globalDialogOpen, setGlobalDialogOpen] = useState(false)
  const globalDialogPromiseRef = useRef<{resolve: (ok: boolean) => void} | null>(null)

  const safeContent = isValidSlateJson(content)
    ? content
    : '[{"type":"paragraph","children":[{"text":""}]}]'

  // 保存笔记内容
  const handleSave = async (content: string) => {
    if (!noteTitle.trim()) {
      toast.error('请输入笔记标题')
      return
    }

    try {
      _setIsSaving(true)
      setDirty(false)
      
      const data = {
        title: noteTitle,
        _content,
        is_draft: draft
      }

      let result;
      
      if (isEditing && noteId) {
        // 更新笔记
        result = await apiRequest<Note>(`/notes/${noteId}`, 'PUT', data)
        // 更新预览
        if (result.content_markdown) {
          _setMarkdownPreview(result.content_markdown)
        }
      } else {
        // 创建新笔记
        result = await apiRequest<Note>('/notes', 'POST', data)
        if (result.content_markdown) {
          _setMarkdownPreview(result.content_markdown)
        }
      }
      
      toast.success(isEditing ? '笔记已更新' : '笔记已创建')
      
      // 如果是新笔记，跳转到编辑页面
      if (!isEditing && result.id) {
        router.push(`/note/edit/${result.id}`)
        router.refresh()
      }
      
      return Promise.resolve()
    } catch {
      console.error('保存笔记错误:', error)
      toast.error('保存失败')
      return Promise.reject(error)
    } finally {
      _setIsSaving(false)
    }
  }

  // 处理草稿状态变化
  const handleDraftChange = (newDraft: boolean) => {
    setDraft(newDraft)
  }

  // 处理导航离开
  const handleNavigation = (action: () => void) => {
    setDirty(false)
    if (noteTitle.trim() || content !== safeContent) {
      setShowConfirmDialog(true)
      setPendingAction(() => action)
    } else {
      action()
    }
  }

  // 确认离开
  const handleConfirmLeave = () => {
    if (pendingAction) {
      pendingAction()
    }
    setShowConfirmDialog(false)
    setPendingAction(null)
  }

  // 取消离开
  const handleCancelLeave = () => {
    setShowConfirmDialog(false)
    setPendingAction(null)
  }

  // 处理图片上传
  const handleImageUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('image', file)
      
      const result = await apiRequest<UploadResult>('/upload/image', 'POST', formData, { 
        handleError: false
      })
      
      return result
    } catch {
      console.error('图片上传错误:', error)
      toast.error('图片上传失败')
      throw error
    }
  }

  // 编辑器内容改变时更新预览
  const handleEditorChange = (content: string) => {
    setDirty(true)
    // 这里会从保存后的响应中获取markdown预览
  }

  // 保存为草稿
  const saveDraft = async () => {
    if (!noteTitle.trim()) {
      toast.error('请输入笔记标题')
      return
    }
    try {
      _setIsSaving(true)
      const data = {
        title: noteTitle,
        content: safeContent,
        is_draft: true
      }
      if (isEditing && noteId) {
        await apiRequest<Note>(`/notes/${noteId}`, 'PUT', data)
      } else {
        await apiRequest<Note>('/notes', 'POST', data)
      }
      setDirty(false)
      toast.success('已保存为草稿')
    } catch {
      toast.error('保存草稿失败')
    } finally {
      _setIsSaving(false)
    }
  }

  // 封装 showDialog，返回 Promise<boolean>
  const showDialog = () => {
    setGlobalDialogOpen(true)
    return new Promise<boolean>((resolve) => {
      globalDialogPromiseRef.current = { resolve }
    })
  }

  // 全局拦截
  useGlobalNavigationGuard(showDialog)

  // 全局弹窗确认/取消
  const handleGlobalConfirm = async () => {
    await saveDraft()
    setGlobalDialogOpen(false)
    globalDialogPromiseRef.current?.resolve(true)
  }
  const handleGlobalCancel = () => {
    setGlobalDialogOpen(false)
    globalDialogPromiseRef.current?.resolve(false)
  }

  useEffect(() => {
    setSaveDraft(saveDraft)
    return () => setSaveDraft(undefined)
  }, [noteTitle, safeContent, isEditing, noteId])

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-4 flex items-center gap-2">
        <Button 
          variant="ghost" 
          onClick={() => handleNavigation(() => router.push('/note'))}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="flex-1 text-xl font-bold">
          {isEditing ? '编辑笔记' : '创建新笔记'}
          {draft && <span className="ml-2 text-sm text-muted-foreground">(草稿)</span>}
        </h1>
      </div>
      <div className="mb-4">
        <Input
          id="title"
          value={noteTitle}
          onChange={(e) => setNoteTitle(e.target.value)}
          className="mt-1"
          placeholder="请输入笔记标题"
        />
      </div>
      <MarkdownEditor
        initialContent={safeContent}
        onSave={handleSave}
        onImageUpload={handleImageUpload}
        minHeight="400px"
        isDraft={draft}
        onDraftChange={handleDraftChange}
        onChange={handleEditorChange}
      />
      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="确认离开"
        description="您有未保存的更改，是否要保存为草稿？"
        onConfirm={handleConfirmLeave}
        onCancel={handleCancelLeave}
        confirmText="保存为草稿"
        cancelText="不保存"
      />
      <ConfirmDialog
        open={globalDialogOpen}
        onOpenChange={setGlobalDialogOpen}
        title="确认离开"
        description="您有未保存的内容，是否保存为草稿或继续跳转？"
        onConfirm={handleGlobalConfirm}
        onCancel={handleGlobalCancel}
        confirmText="保存并跳转"
        cancelText="取消"
      />
    </div>
  )
} 