'use client'

import { useState, useCallback, useEffect } from 'react'
import { SaveOptionsDialog } from '@/components/ui/save-options-dialog'
import { useEditorStore } from '../store/editorStore'
import { useGlobalNavigationGuard } from '../hooks/useGlobalNavigationGuard'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { useNoteSave } from '../hooks/useNoteSave'
import { useNoteDialogs } from '../hooks/useNoteDialogs'
import { NoteTitleInput } from './NoteTitleInput'
import { isValidNovelJson, DEFAULT_NOVEL_CONTENT } from '../utils/noteValidation'

interface NoteEditorProps {
  noteId?: number
  title?: string
  content?: string
  isEditing?: boolean
  initialMarkdown?: string
  isDraft?: boolean
}

export default function NoteEditor({
  noteId,
  title = '',
  content = '',
  isEditing = false,
  isDraft = false,
}: NoteEditorProps) {
  const [noteTitle, setNoteTitle] = useState(title)
  const [currentContent] = useState(() =>
    content && isValidNovelJson(content) ? content : DEFAULT_NOVEL_CONTENT
  )

  const draft = isDraft
  const { setSaveDraft } = useEditorStore()

  // 语音输入功能
  const {
    isSupported: isVoiceSupported,
    isListening: isVoiceListening,
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

  // 保存功能
  const {
    isSaving,
    handleSave,
    saveDraft: saveDraftFn,
  } = useNoteSave({
    noteId,
    isEditing,
    draft,
  })

  // 处理对话框操作
  const handleDialogAction = useCallback(
    async (action: 'saveDraft' | 'save' | 'discard', title: string, content: string) => {
      if (action === 'saveDraft') {
        await saveDraftFn(title, content)
      } else if (action === 'save' && title.trim()) {
        await handleSave(title, content)
      }
    },
    [saveDraftFn, handleSave]
  )

  // 对话框管理
  const {
    showConfirmDialog,
    setShowConfirmDialog,
    setPendingAction,
    globalDialogOpen,
    setGlobalDialogOpen,
    handleLeave,
    handleGlobalAction,
    showDialog,
  } = useNoteDialogs({
    onAction: handleDialogAction,
    title: noteTitle,
    content: currentContent,
  })

  // 全局拦截
  useGlobalNavigationGuard(showDialog)

  useEffect(() => {
    const saveDraftHandler = async () => {
      if (noteTitle.trim() && currentContent) {
        await saveDraftFn(noteTitle, currentContent)
      }
    }
    setSaveDraft(saveDraftHandler)
    return () => setSaveDraft(undefined)
  }, [noteTitle, currentContent, saveDraftFn, setSaveDraft])

  const dialogProps = {
    title: '确认离开',
    description: '您有未保存的更改，请选择如何处理：',
    onSaveDraft: () => handleLeave('saveDraft'),
    onSave: () => handleLeave('save'),
    onDiscard: () => handleLeave('discard'),
    saveDraftText: '保存为草稿',
    saveText: '保存',
    discardText: '放弃保存',
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <NoteTitleInput
        title={noteTitle}
        onTitleChange={setNoteTitle}
        isSaving={isSaving}
        isVoiceListening={isVoiceListening}
        isVoiceSupported={isVoiceSupported}
        onVoiceToggle={handleVoiceToggle}
      />
      {/* TODO: Replace with actual editor component */}
      <div className="bg-muted/20 min-h-[400px] rounded-md border p-4">
        <p className="text-muted-foreground">编辑器组件待实现</p>
      </div>
      <SaveOptionsDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        {...dialogProps}
      />
      <SaveOptionsDialog
        open={globalDialogOpen}
        onOpenChange={setGlobalDialogOpen}
        {...dialogProps}
        description="您有未保存的内容，请选择如何处理："
      />
    </div>
  )
}
