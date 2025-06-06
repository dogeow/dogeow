"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { apiRequest } from '@/lib/api'
import MarkdownEditor from '@/components/markdown/MarkdownEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { SaveOptionsDialog } from '@/components/ui/save-options-dialog'
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
  
  // 添加当前编辑器内容状态
  const [currentContent, setCurrentContent] = useState(() => {
    return isValidSlateJson(content)
      ? content
      : '[{"type":"paragraph","children":[{"text":""}]}]'
  })
  
  // 添加最后保存的内容状态，用于判断是否有未保存更改
  const [lastSavedContent, setLastSavedContent] = useState(() => {
    return isValidSlateJson(content)
      ? content
      : '[{"type":"paragraph","children":[{"text":""}]}]'
  })
  
  // 添加最后保存的标题状态
  const [lastSavedTitle, setLastSavedTitle] = useState(title)

  const safeContent = currentContent

  // 保存笔记内容
  const handleSave = async (content: string) => {
    if (!noteTitle.trim()) {
      toast.error('请输入笔记标题')
      return
    }

    try {
      setIsSaving(true)
      setDirty(false)
      
      const data = {
        title: noteTitle,
        content,
        is_draft: draft
      }

      let result;
      
      if (isEditing && noteId) {
        // 更新笔记
        result = await apiRequest<Note>(`/notes/${noteId}`, 'PUT', data)
        // 更新预览
        if (result.content_markdown) {
          setMarkdownPreview(result.content_markdown)
        }
      } else {
        // 创建新笔记
        result = await apiRequest<Note>('/notes', 'POST', data)
        if (result.content_markdown) {
          setMarkdownPreview(result.content_markdown)
        }
      }
      
      // 保存成功后，更新最后保存的内容和标题
      setLastSavedContent(content)
      setLastSavedTitle(noteTitle)
      
      toast.success(isEditing ? '笔记已更新' : '笔记已创建')
      
      // 如果是新笔记，跳转到编辑页面
      if (!isEditing && result.id) {
        router.push(`/note/edit/${result.id}`)
        router.refresh()
      }
      
      return Promise.resolve()
    } catch (error) {
      console.error('保存笔记错误:', error)
      toast.error('保存失败')
      return Promise.reject(error)
    } finally {
      setIsSaving(false)
    }
  }

  // 处理草稿状态变化
  const handleDraftChange = async (newDraft: boolean) => {
    if (!noteTitle.trim()) {
      toast.error('请输入笔记标题')
      return
    }

    try {
      setIsSaving(true)
      setDraft(newDraft)
      
      const data = {
        title: noteTitle,
        content: currentContent,
        is_draft: newDraft
      }

      let result;
      
      if (isEditing && noteId) {
        // 更新笔记
        result = await apiRequest<Note>(`/notes/${noteId}`, 'PUT', data)
      } else {
        // 创建新笔记
        result = await apiRequest<Note>('/notes', 'POST', data)
      }
      
      // 保存成功后，更新最后保存的内容和标题
      setLastSavedContent(currentContent)
      setLastSavedTitle(noteTitle)
      setDirty(false)
      
      if (newDraft) {
        toast.success('已保存为草稿')
      } else {
        toast.success('已发布为正式笔记')
      }
      
      // 如果是新笔记，跳转到编辑页面
      if (!isEditing && result.id) {
        router.push(`/note/edit/${result.id}`)
        router.refresh()
      }
      
    } catch (error) {
      console.error('保存笔记错误:', error)
      toast.error('保存失败')
      // 恢复原来的状态
      setDraft(!newDraft)
    } finally {
      setIsSaving(false)
    }
  }

  // 处理导航离开
  const handleNavigation = (action: () => void) => {
    setDirty(false)
    // 比较当前内容和标题与最后保存的状态
    if (noteTitle !== lastSavedTitle || currentContent !== lastSavedContent) {
      setShowConfirmDialog(true)
      setPendingAction(() => action)
    } else {
      action()
    }
  }

  // 处理保存草稿并离开
  const handleSaveDraftAndLeave = async () => {
    await saveDraft()
    if (pendingAction) {
      pendingAction()
    }
    setShowConfirmDialog(false)
    setPendingAction(null)
  }

  // 处理保存并离开
  const handleSaveAndLeave = async () => {
    if (currentContent && noteTitle.trim()) {
      await handleSave(currentContent)
    }
    if (pendingAction) {
      pendingAction()
    }
    setShowConfirmDialog(false)
    setPendingAction(null)
  }

  // 处理放弃保存并离开
  const handleDiscardAndLeave = () => {
    if (pendingAction) {
      pendingAction()
    }
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
    } catch (error) {
      console.error('图片上传错误:', error)
      toast.error('图片上传失败')
      throw error
    }
  }

  // 编辑器内容改变时更新预览
  const handleEditorChange = (content: string) => {
    setDirty(true)
    setCurrentContent(content)
  }

  // 保存为草稿
  const saveDraft = async () => {
    if (!noteTitle.trim()) {
      toast.error('请输入笔记标题')
      return
    }
    
    console.log('开始保存草稿...', {
      title: noteTitle,
      content: currentContent,
      isEditing,
      noteId
    })
    
    try {
      setIsSaving(true)
      const data = {
        title: noteTitle,
        content: currentContent,
        is_draft: true
      }
      
      console.log('发送草稿保存请求:', data)
      
      let result
      if (isEditing && noteId) {
        result = await apiRequest<Note>(`/notes/${noteId}`, 'PUT', data)
        console.log('更新草稿成功:', result)
      } else {
        result = await apiRequest<Note>('/notes', 'POST', data)
        console.log('创建草稿成功:', result)
      }
      
      setDirty(false)
      // 保存草稿成功后，也更新最后保存的内容和标题
      setLastSavedContent(currentContent)
      setLastSavedTitle(noteTitle)
      toast.success('已保存为草稿')
    } catch (error) {
      console.error('保存草稿失败:', error)
      toast.error('保存草稿失败')
    } finally {
      setIsSaving(false)
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

  // 全局弹窗 - 保存草稿并跳转
  const handleGlobalSaveDraft = async () => {
    await saveDraft()
    setGlobalDialogOpen(false)
    globalDialogPromiseRef.current?.resolve(true)
  }

  // 全局弹窗 - 保存并跳转
  const handleGlobalSave = async () => {
    if (currentContent && noteTitle.trim()) {
      await handleSave(currentContent)
    }
    setGlobalDialogOpen(false)
    globalDialogPromiseRef.current?.resolve(true)
  }

  // 全局弹窗 - 放弃保存并跳转
  const handleGlobalDiscard = () => {
    setGlobalDialogOpen(false)
    globalDialogPromiseRef.current?.resolve(true)
  }

  useEffect(() => {
    setSaveDraft(saveDraft)
    return () => setSaveDraft(undefined)
  }, [noteTitle, currentContent, isEditing, noteId])

  return (
    <div className="w-full max-w-6xl mx-auto">
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
      <SaveOptionsDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="确认离开"
        description="您有未保存的更改，请选择如何处理："
        onSaveDraft={handleSaveDraftAndLeave}
        onSave={handleSaveAndLeave}
        onDiscard={handleDiscardAndLeave}
        saveDraftText="保存为草稿"
        saveText="保存"
        discardText="放弃保存"
      />
      <SaveOptionsDialog
        open={globalDialogOpen}
        onOpenChange={setGlobalDialogOpen}
        title="确认离开"
        description="您有未保存的内容，请选择如何处理："
        onSaveDraft={handleGlobalSaveDraft}
        onSave={handleGlobalSave}
        onDiscard={handleGlobalDiscard}
        saveDraftText="保存为草稿"
        saveText="保存"
        discardText="放弃保存"
      />
    </div>
  )
} 