import React, { memo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Save, Loader2, Lock, Unlock } from 'lucide-react'

interface NoteEditorToolbarProps {
  title: string
  isPrivate: boolean
  isSaving: boolean
  onTitleChange: (value: string) => void
  onSave: () => void
  onTogglePrivacy: () => void
}

export const NoteEditorToolbar = memo<NoteEditorToolbarProps>(
  ({ title, isPrivate, isSaving, onTitleChange, onSave, onTogglePrivacy }) => {
    // 添加按钮交互状态
    const [privacyButtonHovered, setPrivacyButtonHovered] = useState(false)
    const [saveButtonHovered, setSaveButtonHovered] = useState(false)
    const [privacyButtonPressed, setPrivacyButtonPressed] = useState(false)
    const [saveButtonPressed, setSaveButtonPressed] = useState(false)

    return (
      <div className="mb-4 flex items-center gap-2">
        <Input
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          placeholder="请输入笔记标题"
          className="flex-1 text-lg font-medium"
        />
        <Button
          onClick={onTogglePrivacy}
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
          onClick={onSave}
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
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        </Button>
      </div>
    )
  }
)

NoteEditorToolbar.displayName = 'NoteEditorToolbar'
