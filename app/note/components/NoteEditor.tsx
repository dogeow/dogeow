'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { toast } from 'react-hot-toast'
import { apiRequest } from '@/lib/api'
import { useEditorStore } from '../store/editorStore'
import { useGlobalNavigationGuard } from '../hooks/useGlobalNavigationGuard'
import { SaveOptionsDialog } from '@/components/ui/save-options-dialog'

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

function isValidSlateJson(str: string) {
  try {
    const parsed = JSON.parse(str)
    return Array.isArray(parsed) || (typeof parsed === 'object' && parsed.type === 'doc')
  } catch {
    return false
  }
}

export default function NoteEditor({
  noteId,
  title = '',
  content = '',
  isEditing = false,
  isDraft = false,
}: NoteEditorProps) {
  const router = useRouter()
  const [noteTitle, setNoteTitle] = useState(title)
  const [currentContent] = useState(() => {
    if (content && isValidSlateJson(content)) {
      return content
    }
    return '[{"type":"paragraph","children":[{"text":""}]}]'
  })
  const [isSaving, setIsSaving] = useState(false)
  const [draft] = useState(isDraft)
  const [, setDirty] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  const [globalDialogOpen, setGlobalDialogOpen] = useState(false)
  const globalDialogPromiseRef = useRef<{ resolve: (value: boolean) => void } | null>(null)

  const { setSaveDraft } = useEditorStore()

  // 保存最后一次保存的内容和标题，用于比较是否有变化
  const [, setLastSavedContent] = useState(() => {
    return content && isValidSlateJson(content)
      ? content
      : '[{"type":"paragraph","children":[{"text":""}]}]'
  })

  // 添加最后保存的标题状态
  const [, setLastSavedTitle] = useState(title)

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
        is_draft: draft,
      }

      let result

      if (isEditing && noteId) {
        // 更新笔记
        result = await apiRequest<Note>(`/notes/${noteId}`, 'PUT', data)
      } else {
        // 创建新笔记
        result = await apiRequest<Note>('/notes', 'POST', data)
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

  // 保存为草稿
  const saveDraft = useCallback(async () => {
    if (!noteTitle.trim()) {
      toast.error('请输入笔记标题')
      return
    }

    console.log('开始保存草稿...', {
      title: noteTitle,
      content: currentContent,
      isEditing,
      noteId,
    })

    try {
      setIsSaving(true)
      const data = {
        title: noteTitle,
        content: currentContent,
        is_draft: true,
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
  }, [noteTitle, currentContent, isEditing, noteId, setLastSavedContent, setLastSavedTitle])

  // 封装 showDialog，返回 Promise<boolean>
  const showDialog = () => {
    setGlobalDialogOpen(true)
    return new Promise<boolean>(resolve => {
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
  }, [noteTitle, currentContent, isEditing, noteId, saveDraft, setSaveDraft])

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-4">
        <Input
          id="title"
          value={noteTitle}
          onChange={e => setNoteTitle(e.target.value)}
          className="mt-1"
          placeholder="请输入笔记标题"
          disabled={isSaving}
        />
      </div>
      {/* TODO: Replace with actual editor component */}
      <div className="bg-muted/20 min-h-[400px] rounded-md border p-4">
        <p className="text-muted-foreground">编辑器组件待实现</p>
      </div>
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
