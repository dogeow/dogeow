import React, { memo } from 'react'
import { Input } from '@/components/ui/input'
import { VoiceInputButton } from '@/components/ui/voice-input-button'

interface NoteTitleInputProps {
  title: string
  onTitleChange: (value: string) => void
  isSaving: boolean
  isVoiceListening: boolean
  isVoiceSupported: boolean
  onVoiceToggle: () => void
}

export const NoteTitleInput = memo<NoteTitleInputProps>(
  ({ title, onTitleChange, isSaving, isVoiceListening, isVoiceSupported, onVoiceToggle }) => {
    return (
      <div className="mb-4 flex gap-2">
        <Input
          id="title"
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          className="mt-1 flex-1"
          placeholder="请输入笔记标题"
          disabled={isSaving}
        />
        <VoiceInputButton
          isListening={isVoiceListening}
          isSupported={isVoiceSupported}
          onToggle={onVoiceToggle}
          disabled={isSaving}
          className="mt-1"
        />
      </div>
    )
  }
)

NoteTitleInput.displayName = 'NoteTitleInput'
