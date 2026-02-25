import React from 'react'
import NextImage from 'next/image'
import {
  ChevronDown,
  ChevronUp,
  Send,
  Square,
  Bot,
  BookOpen,
  ImagePlus,
  Loader2,
  X,
} from 'lucide-react'
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

// AI 提供商类型
type AIProvider = 'github' | 'minimax' | 'ollama' | 'zhipuai'

const PROVIDER_LABELS: Record<AIProvider, string> = {
  ollama: 'Ollama',
  github: 'GitHub',
  minimax: 'MiniMax',
  zhipuai: '智谱AI',
}

function getModelLabel(provider: AIProvider | undefined, model: string | undefined): string {
  if (!provider || !model) return ''
  if (provider === 'ollama') {
    const labels: Record<string, string> = {
      'qwen2.5:0.5b': '快速',
      'qwen3:0.6b': '中等',
      'qwen3:8b': '慢速',
      'qwen3:14b': '超慢速',
      'qwen3-embedding:0.6b': 'qwen3-embedding',
      embeddinggemma: 'embeddinggemma',
      'nomic-embed-text:latest': 'nomic-embed-text',
    }
    return labels[model] ?? model
  }
  if (provider === 'zhipuai') {
    const labels: Record<string, string> = {
      'glm-4.7': 'GLM-4.7',
      'glm-4.6v-flash': 'GLM-4.6V Flash',
      'glm-4.6v': 'GLM-4.6V',
      'glm-4.5-air': 'GLM-4.5-Air',
    }
    return labels[model] ?? model
  }
  if (provider === 'github') return 'GPT-5 Mini'
  if (provider === 'minimax') return 'M2.5'
  return model
}

interface ChatInputProps {
  prompt: string
  onPromptChange: (value: string) => void
  onSend: () => void
  onStop?: () => void
  isLoading: boolean
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

export const ChatInput = React.memo<ChatInputProps>(
  ({
    prompt,
    onPromptChange,
    onSend,
    onStop,
    isLoading,
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
    const [providerMenuOpen, setProviderMenuOpen] = React.useState(false)
    const [modelMenuOpen, setModelMenuOpen] = React.useState(false)
    const canSend = prompt.trim().length > 0 || images.length > 0
    const canUploadImages = chatMode !== 'knowledge' && !!onImageSelect

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

    if (variant === 'dialog') {
      return (
        <div className="flex-none border-t p-2">
          {canUploadImages && images.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {images.map((item, index) => (
                <div key={item.id} className="group relative">
                  <NextImage
                    src={item.preview}
                    alt={`上传图片 ${index + 1}`}
                    width={56}
                    height={56}
                    unoptimized
                    className="h-14 w-14 rounded-md border object-cover"
                  />
                  {item.uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/40">
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveImage?.(index)}
                    className="absolute -top-1.5 -right-1.5 rounded-full bg-black/70 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="移除图片"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {canUploadImages && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileInputChange}
            />
          )}

          {/* 输入框上方：提供商与模型（文字展示，点击弹窗选择） */}
          {chatMode === 'ai' && provider && onProviderChange && (
            <div className="mb-2 flex items-center gap-1.5 text-sm">
              <DropdownMenu open={providerMenuOpen} onOpenChange={setProviderMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isLoading}
                    className="h-auto gap-1 px-0 py-1 font-normal text-muted-foreground hover:text-foreground"
                  >
                    {PROVIDER_LABELS[provider]}
                    {providerMenuOpen ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronUp className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  <DropdownMenuRadioGroup
                    value={provider}
                    onValueChange={v => onProviderChange(v as AIProvider)}
                  >
                    <DropdownMenuRadioItem
                      value="ollama"
                      className={cn(
                        'cursor-pointer',
                        provider === 'ollama' &&
                          'bg-primary/10 ring-primary relative z-10 font-medium ring-2 ring-offset-1'
                      )}
                    >
                      <div className="flex flex-col">
                        <span>Ollama</span>
                        <span className="text-muted-foreground text-xs">本地模型</span>
                      </div>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="github"
                      className={cn(
                        'cursor-pointer',
                        provider === 'github' &&
                          'relative z-10 bg-green-500/10 font-medium ring-2 ring-green-500 ring-offset-1'
                      )}
                    >
                      <div className="flex flex-col">
                        <span>GitHub</span>
                        <span className="text-muted-foreground text-xs">GPT-5 Mini</span>
                      </div>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="minimax"
                      className={cn(
                        'cursor-pointer',
                        provider === 'minimax' &&
                          'relative z-10 bg-orange-500/10 font-medium ring-2 ring-orange-500 ring-offset-1'
                      )}
                    >
                      <div className="flex flex-col">
                        <span>MiniMax</span>
                        <span className="text-muted-foreground text-xs">M2.5</span>
                      </div>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="zhipuai"
                      className={cn(
                        'cursor-pointer',
                        provider === 'zhipuai' &&
                          'relative z-10 bg-cyan-500/10 font-medium ring-2 ring-cyan-500 ring-offset-1'
                      )}
                    >
                      <div className="flex flex-col">
                        <span>智谱AI</span>
                        <span className="text-muted-foreground text-xs">GLM 系列</span>
                      </div>
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              {model && onModelChange && (provider === 'ollama' || provider === 'zhipuai') && (
                <>
                  <span className="text-muted-foreground">·</span>
                  {provider === 'ollama' && (
                    <DropdownMenu open={modelMenuOpen} onOpenChange={setModelMenuOpen}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isLoading}
                          className="h-auto gap-1 px-0 py-1 font-normal text-muted-foreground hover:text-foreground"
                        >
                          {getModelLabel(provider, model)}
                          {modelMenuOpen ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronUp className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuRadioGroup value={model} onValueChange={onModelChange}>
                          <DropdownMenuRadioItem
                            value="qwen2.5:0.5b"
                            className={cn(
                              'cursor-pointer',
                              model === 'qwen2.5:0.5b' &&
                                'bg-primary/10 ring-primary relative z-10 font-medium ring-2 ring-offset-1'
                            )}
                          >
                            <div className="flex flex-col">
                              <span>快速</span>
                              <span className="text-muted-foreground text-xs">qwen2.5:0.5b</span>
                            </div>
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem
                            value="qwen3:0.6b"
                            className={cn(
                              'cursor-pointer',
                              model === 'qwen3:0.6b' &&
                                'relative z-10 bg-blue-500/10 font-medium ring-2 ring-blue-500 ring-offset-1'
                            )}
                          >
                            <div className="flex flex-col">
                              <span>中等</span>
                              <span className="text-muted-foreground text-xs">qwen3:0.6b</span>
                            </div>
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem
                            value="qwen3:8b"
                            className={cn(
                              'cursor-pointer',
                              model === 'qwen3:8b' &&
                                'relative z-10 bg-purple-500/10 font-medium ring-2 ring-purple-500 ring-offset-1'
                            )}
                          >
                            <div className="flex flex-col">
                              <span>慢速</span>
                              <span className="text-muted-foreground text-xs">qwen3:8b</span>
                            </div>
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {provider === 'zhipuai' && (
                    <DropdownMenu open={modelMenuOpen} onOpenChange={setModelMenuOpen}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isLoading}
                          className="h-auto gap-1 px-0 py-1 font-normal text-muted-foreground hover:text-foreground"
                        >
                          {getModelLabel(provider, model)}
                          {modelMenuOpen ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronUp className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuRadioGroup value={model} onValueChange={onModelChange}>
                          <DropdownMenuRadioItem value="glm-4.7" className="cursor-pointer">
                            <div className="flex flex-col">
                              <span>GLM-4.7</span>
                              <span className="text-muted-foreground text-xs">最新旗舰</span>
                            </div>
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="glm-4.6v-flash" className="cursor-pointer">
                            <div className="flex flex-col">
                              <span>GLM-4.6V Flash</span>
                              <span className="text-muted-foreground text-xs">视觉理解</span>
                            </div>
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="glm-4.6v" className="cursor-pointer">
                            <div className="flex flex-col">
                              <span>GLM-4.6V</span>
                              <span className="text-muted-foreground text-xs">视觉理解(标准)</span>
                            </div>
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="glm-4.5-air" className="cursor-pointer">
                            <div className="flex flex-col">
                              <span>GLM-4.5-Air</span>
                              <span className="text-muted-foreground text-xs">轻量快速</span>
                            </div>
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </>
              )}
            </div>
          )}

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
              {canUploadImages && (
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
              )}
              <Button
                onClick={isLoading && onStop ? onStop : onSend}
                disabled={isLoading ? false : !canSend}
                size="icon"
                className="h-12 w-12"
              >
                {isLoading ? <Square className="h-5 w-5" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          {canUploadImages && isUploadingImages && (
            <div className="text-muted-foreground mt-2 text-xs">图片上传中...</div>
          )}
        </div>
      )
    }

    // page variant
    return (
      <div className="bg-background border-t p-4">
        <div className="mx-auto max-w-4xl">
          {canUploadImages && images.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {images.map((item, index) => (
                <div key={item.id} className="group relative">
                  <NextImage
                    src={item.preview}
                    alt={`上传图片 ${index + 1}`}
                    width={56}
                    height={56}
                    unoptimized
                    className="h-14 w-14 rounded-md border object-cover"
                  />
                  {item.uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/40">
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveImage?.(index)}
                    className="absolute -top-1.5 -right-1.5 rounded-full bg-black/70 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="移除图片"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {canUploadImages && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileInputChange}
            />
          )}

          {/* 输入框上方：提供商与模型（文字展示，点击弹窗选择） */}
          {chatMode === 'ai' && provider && onProviderChange && (
            <div className="mb-2 flex items-center gap-1.5 text-sm">
              <DropdownMenu open={providerMenuOpen} onOpenChange={setProviderMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isLoading}
                    className="h-auto gap-1 px-0 py-1 font-normal text-muted-foreground hover:text-foreground"
                  >
                    {PROVIDER_LABELS[provider]}
                    {providerMenuOpen ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronUp className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  <DropdownMenuRadioGroup
                    value={provider}
                    onValueChange={v => onProviderChange(v as AIProvider)}
                  >
                    <DropdownMenuRadioItem
                      value="ollama"
                      className={cn(
                        'cursor-pointer',
                        provider === 'ollama' &&
                          'bg-primary/10 ring-primary relative z-10 font-medium ring-2 ring-offset-1'
                      )}
                    >
                      <div className="flex flex-col">
                        <span>Ollama</span>
                        <span className="text-muted-foreground text-xs">本地模型</span>
                      </div>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="github"
                      className={cn(
                        'cursor-pointer',
                        provider === 'github' &&
                          'relative z-10 bg-green-500/10 font-medium ring-2 ring-green-500 ring-offset-1'
                      )}
                    >
                      <div className="flex flex-col">
                        <span>GitHub</span>
                        <span className="text-muted-foreground text-xs">GPT-5 Mini</span>
                      </div>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="minimax"
                      className={cn(
                        'cursor-pointer',
                        provider === 'minimax' &&
                          'relative z-10 bg-orange-500/10 font-medium ring-2 ring-orange-500 ring-offset-1'
                      )}
                    >
                      <div className="flex flex-col">
                        <span>MiniMax</span>
                        <span className="text-muted-foreground text-xs">M2.5</span>
                      </div>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="zhipuai"
                      className={cn(
                        'cursor-pointer',
                        provider === 'zhipuai' &&
                          'relative z-10 bg-cyan-500/10 font-medium ring-2 ring-cyan-500 ring-offset-1'
                      )}
                    >
                      <div className="flex flex-col">
                        <span>智谱AI</span>
                        <span className="text-muted-foreground text-xs">GLM 系列</span>
                      </div>
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              {model && onModelChange && (provider === 'ollama' || provider === 'zhipuai') && (
                <>
                  <span className="text-muted-foreground">·</span>
                  {provider === 'ollama' && (
                    <DropdownMenu open={modelMenuOpen} onOpenChange={setModelMenuOpen}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isLoading}
                          className="h-auto gap-1 px-0 py-1 font-normal text-muted-foreground hover:text-foreground"
                        >
                          {getModelLabel(provider, model)}
                          {modelMenuOpen ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronUp className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuRadioGroup value={model} onValueChange={onModelChange}>
                          <DropdownMenuRadioItem
                            value="qwen2.5:0.5b"
                            className={cn(
                              'cursor-pointer',
                              model === 'qwen2.5:0.5b' &&
                                'bg-primary/10 ring-primary relative z-10 font-medium ring-2 ring-offset-1'
                            )}
                          >
                            <div className="flex flex-col">
                              <span>快速</span>
                              <span className="text-muted-foreground text-xs">qwen2.5:0.5b</span>
                            </div>
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem
                            value="qwen3:0.6b"
                            className={cn(
                              'cursor-pointer',
                              model === 'qwen3:0.6b' &&
                                'relative z-10 bg-blue-500/10 font-medium ring-2 ring-blue-500 ring-offset-1'
                            )}
                          >
                            <div className="flex flex-col">
                              <span>中等</span>
                              <span className="text-muted-foreground text-xs">qwen3:0.6b</span>
                            </div>
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem
                            value="qwen3:8b"
                            className={cn(
                              'cursor-pointer',
                              model === 'qwen3:8b' &&
                                'relative z-10 bg-purple-500/10 font-medium ring-2 ring-purple-500 ring-offset-1'
                            )}
                          >
                            <div className="flex flex-col">
                              <span>慢速</span>
                              <span className="text-muted-foreground text-xs">qwen3:8b</span>
                            </div>
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem
                            value="qwen3:14b"
                            className={cn(
                              'cursor-pointer',
                              model === 'qwen3:14b' &&
                                'relative z-10 bg-purple-500/10 font-medium ring-2 ring-purple-500 ring-offset-1'
                            )}
                          >
                            <div className="flex flex-col">
                              <span>超慢速</span>
                              <span className="text-muted-foreground text-xs">qwen3:14b</span>
                            </div>
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem
                            value="qwen3-embedding:0.6b"
                            className={cn(
                              'cursor-pointer',
                              model === 'qwen3-embedding:0.6b' &&
                                'relative z-10 bg-amber-500/10 font-medium ring-2 ring-amber-500 ring-offset-1'
                            )}
                          >
                            <div className="flex flex-col">
                              <span>检索用（不用于对话）</span>
                              <span className="text-muted-foreground text-xs">
                                qwen3-embedding:0.6b
                              </span>
                            </div>
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem
                            value="embeddinggemma"
                            className={cn(
                              'cursor-pointer',
                              model === 'embeddinggemma' &&
                                'relative z-10 bg-amber-500/10 font-medium ring-2 ring-amber-500 ring-offset-1'
                            )}
                          >
                            <div className="flex flex-col">
                              <span>检索用（不用于对话）</span>
                              <span className="text-muted-foreground text-xs">embeddinggemma</span>
                            </div>
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem
                            value="nomic-embed-text:latest"
                            className={cn(
                              'cursor-pointer',
                              model === 'nomic-embed-text:latest' &&
                                'relative z-10 bg-amber-500/10 font-medium ring-2 ring-amber-500 ring-offset-1'
                            )}
                          >
                            <div className="flex flex-col">
                              <span>检索用（不用于对话）</span>
                              <span className="text-muted-foreground text-xs">
                                nomic-embed-text:latest
                              </span>
                            </div>
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {provider === 'zhipuai' && (
                    <DropdownMenu open={modelMenuOpen} onOpenChange={setModelMenuOpen}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isLoading}
                          className="h-auto gap-1 px-0 py-1 font-normal text-muted-foreground hover:text-foreground"
                        >
                          {getModelLabel(provider, model)}
                          {modelMenuOpen ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronUp className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuRadioGroup value={model} onValueChange={onModelChange}>
                          <DropdownMenuRadioItem value="glm-4.7" className="cursor-pointer">
                            <div className="flex flex-col">
                              <span>GLM-4.7</span>
                              <span className="text-muted-foreground text-xs">最新旗舰</span>
                            </div>
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="glm-4.6v-flash" className="cursor-pointer">
                            <div className="flex flex-col">
                              <span>GLM-4.6V Flash</span>
                              <span className="text-muted-foreground text-xs">视觉理解</span>
                            </div>
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="glm-4.6v" className="cursor-pointer">
                            <div className="flex flex-col">
                              <span>GLM-4.6V</span>
                              <span className="text-muted-foreground text-xs">视觉理解(标准)</span>
                            </div>
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="glm-4.5-air" className="cursor-pointer">
                            <div className="flex flex-col">
                              <span>GLM-4.5-Air</span>
                              <span className="text-muted-foreground text-xs">轻量快速</span>
                            </div>
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </>
              )}
            </div>
          )}

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
              {canUploadImages && (
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
              )}
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
              <Button
                onClick={isLoading && onStop ? onStop : onSend}
                disabled={isLoading ? false : !canSend}
                size="icon"
                className="h-12 w-12"
              >
                {isLoading ? <Square className="h-5 w-5" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          {canUploadImages && isUploadingImages && (
            <div className="text-muted-foreground mt-2 text-xs">图片上传中...</div>
          )}
        </div>
      </div>
    )
  }
)

ChatInput.displayName = 'ChatInput'
