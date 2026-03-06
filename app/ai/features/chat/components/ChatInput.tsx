import React from 'react'
import { Send, Square, Bot, BookOpen, ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/helpers'
import { ChatInputImagePreview } from './ChatInputImagePreview'
import {
  type AIProvider,
  type OllamaModelListItem,
  ProviderSelector,
  OllamaModelSelector,
  ZhipuaiModelSelector,
} from './ChatInputModelSelector'

interface ChatInputProps {
  prompt: string
  onPromptChange: (value: string) => void
  onSend: () => void
  onStop?: () => void
  isLoading: boolean
  ollamaModels?: OllamaModelListItem[]
  isLoadingOllamaModels?: boolean
  supportsImages?: boolean
  model?: string
  onModelChange?: (value: string) => void
  provider?: AIProvider
  onProviderChange?: (value: AIProvider) => void
  chatMode?: 'ai' | 'knowledge'
  onChatModeChange?: (value: 'ai' | 'knowledge') => void
  images?: Array<{ id: string; preview: string; uploading?: boolean }>
  isUploadingImages?: boolean
  onImageSelect?: (files: FileList | null) => void
  onRemoveImage?: (index: number) => void
  variant?: 'dialog' | 'page'
  placeholder?: string
}

const ModelSelectorRow = React.memo<{
  chatMode: 'ai' | 'knowledge'
  provider?: AIProvider
  onProviderChange?: (value: AIProvider) => void
  model?: string
  onModelChange?: (value: string) => void
  ollamaModels: OllamaModelListItem[]
  isLoading: boolean
  isLoadingOllamaModels: boolean
}>(
  ({
    chatMode,
    provider,
    onProviderChange,
    model,
    onModelChange,
    ollamaModels,
    isLoading,
    isLoadingOllamaModels,
  }) => {
    if (chatMode === 'ai' && provider && onProviderChange) {
      return (
        <div className="mb-2 flex items-center gap-1.5 text-sm">
          <ProviderSelector
            provider={provider}
            onProviderChange={onProviderChange}
            isLoading={isLoading}
          />
          {model && onModelChange && (provider === 'ollama' || provider === 'zhipuai') && (
            <>
              <span className="text-muted-foreground">·</span>
              {provider === 'ollama' && (
                <OllamaModelSelector
                  model={model}
                  onModelChange={onModelChange}
                  ollamaModels={ollamaModels}
                  isLoading={isLoading}
                  isLoadingOllamaModels={isLoadingOllamaModels}
                />
              )}
              {provider === 'zhipuai' && (
                <ZhipuaiModelSelector
                  model={model}
                  onModelChange={onModelChange}
                  isLoading={isLoading}
                />
              )}
            </>
          )}
        </div>
      )
    }

    if (chatMode === 'knowledge' && model && onModelChange) {
      return (
        <div className="mb-2 flex items-center gap-1.5 text-sm">
          <span className="px-0 py-1 text-muted-foreground">Ollama</span>
          <span className="text-muted-foreground">·</span>
          <OllamaModelSelector
            model={model}
            onModelChange={onModelChange}
            ollamaModels={ollamaModels}
            isLoading={isLoading}
            isLoadingOllamaModels={isLoadingOllamaModels}
          />
        </div>
      )
    }

    return null
  }
)
ModelSelectorRow.displayName = 'ModelSelectorRow'

export const ChatInput = React.memo<ChatInputProps>(
  ({
    prompt,
    onPromptChange,
    onSend,
    onStop,
    isLoading,
    ollamaModels = [],
    isLoadingOllamaModels = false,
    supportsImages = false,
    model,
    onModelChange,
    provider,
    onProviderChange,
    chatMode,
    onChatModeChange,
    images = [],
    isUploadingImages = false,
    onImageSelect,
    onRemoveImage,
    variant = 'page',
    placeholder,
  }) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const canSend = prompt.trim().length > 0 || images.length > 0
    const canUploadImages = chatMode !== 'knowledge' && !!onImageSelect && supportsImages

    const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onImageSelect?.(event.target.files)
      event.target.value = ''
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        if (canSend && !isLoading) {
          onSend()
        }
      }
    }

    const imagePreview = canUploadImages && (
      <ChatInputImagePreview
        images={images}
        onRemoveImage={onRemoveImage}
        className={variant === 'dialog' ? 'mb-2' : 'mb-3'}
      />
    )

    const fileInput = canUploadImages && (
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />
    )

    const modelSelector = chatMode && (
      <ModelSelectorRow
        chatMode={chatMode}
        provider={provider}
        onProviderChange={onProviderChange}
        model={model}
        onModelChange={onModelChange}
        ollamaModels={ollamaModels}
        isLoading={isLoading}
        isLoadingOllamaModels={isLoadingOllamaModels}
      />
    )

    const uploadButton = canUploadImages && (
      <Button
        variant="outline"
        size="icon"
        className="h-12 w-12 border-2"
        disabled={isLoading || images.length >= 5}
        onClick={() => fileInputRef.current?.click()}
        aria-label="上传图片"
      >
        <ImagePlus className={cn('h-5 w-5', images.length > 0 && 'text-cyan-500')} />
      </Button>
    )

    const sendButton = (
      <Button
        onClick={isLoading && onStop ? onStop : onSend}
        disabled={isLoading ? false : !canSend}
        size="icon"
        className="h-12 w-12"
      >
        {isLoading ? <Square className="h-5 w-5" /> : <Send className="h-5 w-5" />}
      </Button>
    )

    const uploadStatus = canUploadImages && isUploadingImages && (
      <div className="text-muted-foreground mt-2 text-xs">图片上传中...</div>
    )

    if (variant === 'dialog') {
      return (
        <div className="flex-none border-t p-2">
          {imagePreview}
          {fileInput}
          {modelSelector}
          <div className="flex items-end gap-2">
            <Textarea
              value={prompt}
              onChange={event => onPromptChange(event.target.value)}
              placeholder={
                placeholder || (images.length > 0 ? '询问关于图片的问题...' : '输入消息...')
              }
              className="max-h-[80px] min-h-[48px] resize-none py-2.5"
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={1}
            />
            <div className="flex gap-2">
              {uploadButton}
              {sendButton}
            </div>
          </div>
          {uploadStatus}
        </div>
      )
    }

    return (
      <div className="bg-background border-t p-4">
        <div className="mx-auto max-w-4xl">
          {imagePreview}
          {fileInput}
          {modelSelector}
          <div className="flex gap-2">
            <Textarea
              value={prompt}
              onChange={event => onPromptChange(event.target.value)}
              placeholder={
                placeholder || (images.length > 0 ? '询问关于图片的问题...' : '输入消息...')
              }
              className="max-h-[80px] min-h-[48px] resize-none py-2.5"
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={1}
            />
            <div className="flex gap-2">
              {uploadButton}
              {chatMode && onChatModeChange && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 border-2 transition-all"
                      disabled={isLoading}
                      aria-label={chatMode === 'knowledge' ? '知识库 AI' : '通用 AI'}
                    >
                      {chatMode === 'knowledge' ? (
                        <BookOpen className="h-5 w-5" />
                      ) : (
                        <Bot className="h-5 w-5" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuRadioGroup
                      value={chatMode}
                      onValueChange={value => onChatModeChange?.(value as 'ai' | 'knowledge')}
                    >
                      <DropdownMenuRadioItem
                        value="ai"
                        className={cn(
                          'cursor-pointer',
                          chatMode === 'ai' &&
                            'bg-primary/10 ring-primary relative z-10 font-medium ring-2 ring-offset-1'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          <span>通用 AI</span>
                        </div>
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="knowledge"
                        className={cn(
                          'cursor-pointer',
                          chatMode === 'knowledge' &&
                            'bg-primary/10 ring-primary relative z-10 font-medium ring-2 ring-offset-1'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          <span>知识库 AI</span>
                        </div>
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {sendButton}
            </div>
          </div>
          {uploadStatus}
        </div>
      </div>
    )
  }
)

ChatInput.displayName = 'ChatInput'
