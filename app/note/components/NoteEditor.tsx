'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { toast } from 'react-hot-toast'
import { apiRequest } from '@/lib/api'
import { useEditorStore } from '../store/editorStore'
import { useGlobalNavigationGuard } from '../hooks/useGlobalNavigationGuard'
import { SaveOptionsDialog } from '@/components/ui/save-options-dialog'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { VoiceInputButton } from '@/components/ui/voice-input-button'

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

// 校验 Novel/Tiptap JSON 格式
function isValidNovelJson(str: string) {
  try {
    const parsed = JSON.parse(str)
    return typeof parsed === 'object' && parsed.type === 'doc' && Array.isArray(parsed.content)
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
  const [currentContent] = useState(() =>
    content && isValidNovelJson(content)
      ? content
      : '{"type":"doc","content":[{"type":"paragraph","content":[]}]}'
  )
  const [isSaving, setIsSaving] = useState(false)
  const [draft] = useState(isDraft)
  const [, setDirty] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  const [globalDialogOpen, setGlobalDialogOpen] = useState(false)
  const globalDialogPromiseRef = useRef<{ resolve: (value: boolean) => void } | null>(null)

  const { setSaveDraft } = useEditorStore()

  // 记录最后一次保存的内容和标题
  const [, setLastSavedContent] = useState(() =>
    content && isValidNovelJson(content)
      ? content
      : '{"type":"doc","content":[{"type":"paragraph","content":[]}]}'
  )
  const [, setLastSavedTitle] = useState(title)

  // 语音输入功能
  const {
    isSupported: isVoiceSupported,
    isListening: isVoiceListening,
    transcript: voiceTranscript,
    startListening,
    stopListening,
  } = useVoiceInput({
    onTranscript: (transcript, isFinal) => {
      if (isFinal && transcript) {
        // 当语音识别完成时，将文本添加到标题输入框
        setNoteTitle(prev => (prev ? `${prev} ${transcript}` : transcript))
      }
    },
    language: 'zh-CN',
    continuous: false,
    interimResults: true,
  })

  // 处理语音输入切换
  const handleVoiceToggle = useCallback(() => {
    if (isVoiceListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isVoiceListening, stopListening, startListening])

  // 保存笔记内容
  const handleSave = useCallback(
    async (content: string) => {
      if (!noteTitle.trim()) {
        toast.error('请输入笔记标题')
        return
      }
      setIsSaving(true)
      setDirty(false)
      const data = {
        title: noteTitle,
        content,
        is_draft: draft,
      }
      try {
        let result: Note
        if (isEditing && noteId) {
          result = await apiRequest<Note>(`/notes/${noteId}`, 'PUT', data)
        } else {
          result = await apiRequest<Note>('/notes', 'POST', data)
        }
        setLastSavedContent(content)
        setLastSavedTitle(noteTitle)
        toast.success(isEditing ? '笔记已更新' : '笔记已创建')
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
    },
    [noteTitle, draft, isEditing, noteId, router]
  )

  // 保存为草稿
  const saveDraft = useCallback(async () => {
    if (!noteTitle.trim()) {
      toast.error('请输入笔记标题')
      return
    }
    setIsSaving(true)
    const data = {
      title: noteTitle,
      content: currentContent,
      is_draft: true,
    }
    try {
      if (isEditing && noteId) {
        await apiRequest<Note>(`/notes/${noteId}`, 'PUT', data)
      } else {
        await apiRequest<Note>('/notes', 'POST', data)
      }
      setDirty(false)
      setLastSavedContent(currentContent)
      setLastSavedTitle(noteTitle)
      toast.success('已保存为草稿')
    } catch (error) {
      console.error('保存草稿失败:', error)
      toast.error('保存草稿失败')
    } finally {
      setIsSaving(false)
    }
  }, [noteTitle, currentContent, isEditing, noteId])

  // 离开弹窗相关操作
  const handleLeave = useCallback(
    async (action: 'saveDraft' | 'save' | 'discard') => {
      if (action === 'saveDraft') {
        await saveDraft()
      } else if (action === 'save') {
        if (currentContent && noteTitle.trim()) {
          await handleSave(currentContent)
        }
      }
      if (pendingAction) pendingAction()
      setShowConfirmDialog(false)
      setPendingAction(null)
    },
    [saveDraft, handleSave, currentContent, noteTitle, pendingAction]
  )

  // 全局弹窗相关操作
  const handleGlobalAction = useCallback(
    async (action: 'saveDraft' | 'save' | 'discard') => {
      if (action === 'saveDraft') {
        await saveDraft()
      } else if (action === 'save') {
        if (currentContent && noteTitle.trim()) {
          await handleSave(currentContent)
        }
      }
      setGlobalDialogOpen(false)
      globalDialogPromiseRef.current?.resolve(true)
    },
    [saveDraft, handleSave, currentContent, noteTitle]
  )

  // 封装 showDialog，返回 Promise<boolean>
  const showDialog = useCallback(() => {
    setGlobalDialogOpen(true)
    return new Promise<boolean>(resolve => {
      globalDialogPromiseRef.current = { resolve }
    })
  }, [])

  // 全局拦截
  useGlobalNavigationGuard(showDialog)

  useEffect(() => {
    setSaveDraft(saveDraft)
    return () => setSaveDraft(undefined)
  }, [saveDraft, setSaveDraft])

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-4 flex gap-2">
        <Input
          id="title"
          value={noteTitle}
          onChange={e => setNoteTitle(e.target.value)}
          className="mt-1 flex-1"
          placeholder="请输入笔记标题"
          disabled={isSaving}
        />
        <VoiceInputButton
          isListening={isVoiceListening}
          isSupported={isVoiceSupported}
          onToggle={handleVoiceToggle}
          disabled={isSaving}
          className="mt-1"
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
        onSaveDraft={() => handleLeave('saveDraft')}
        onSave={() => handleLeave('save')}
        onDiscard={() => handleLeave('discard')}
        saveDraftText="保存为草稿"
        saveText="保存"
        discardText="放弃保存"
      />
      <SaveOptionsDialog
        open={globalDialogOpen}
        onOpenChange={setGlobalDialogOpen}
        title="确认离开"
        description="您有未保存的内容，请选择如何处理："
        onSaveDraft={() => handleGlobalAction('saveDraft')}
        onSave={() => handleGlobalAction('save')}
        onDiscard={() => handleGlobalAction('discard')}
        saveDraftText="保存为草稿"
        saveText="保存"
        discardText="放弃保存"
      />
    </div>
  )
}
