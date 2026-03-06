import React from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/helpers'

export type AIProvider = 'github' | 'minimax' | 'ollama' | 'zhipuai'

export interface OllamaModelListItem {
  name: string
  size?: number
  parameterSize?: string
  supportsVision?: boolean
}

export const PROVIDER_LABELS: Record<AIProvider, string> = {
  ollama: 'Ollama',
  github: 'GitHub',
  minimax: 'MiniMax',
  zhipuai: '智谱AI',
}

const PROVIDER_STYLES: Record<AIProvider, string> = {
  ollama: 'bg-primary/10 ring-primary',
  github: 'bg-green-500/10 ring-green-500',
  minimax: 'bg-orange-500/10 ring-orange-500',
  zhipuai: 'bg-cyan-500/10 ring-cyan-500',
}

const PROVIDER_DESCRIPTIONS: Record<AIProvider, string> = {
  ollama: '本地模型',
  github: 'GPT-5 Mini',
  minimax: 'M2.5',
  zhipuai: 'GLM 系列',
}

export const FALLBACK_OLLAMA_MODELS: OllamaModelListItem[] = [
  { name: 'qwen2.5:0.5b', parameterSize: '0.5B', supportsVision: false },
  { name: 'qwen3:0.6b', parameterSize: '0.6B', supportsVision: false },
  { name: 'qwen3:8b', parameterSize: '8B', supportsVision: false },
  { name: 'qwen3:14b', parameterSize: '14B', supportsVision: false },
]

const ZHIPUAI_MODELS = [
  { value: 'glm-4.7', label: 'GLM-4.7', desc: '最新旗舰' },
  { value: 'glm-4.6v-flash', label: 'GLM-4.6V Flash', desc: '视觉理解' },
  { value: 'glm-4.6v', label: 'GLM-4.6V', desc: '视觉理解(标准)' },
  { value: 'glm-4.5-air', label: 'GLM-4.5-Air', desc: '轻量快速' },
]

export function getModelLabel(provider: AIProvider | undefined, model: string | undefined): string {
  if (!provider || !model) return ''
  if (provider === 'ollama') return model
  if (provider === 'zhipuai') {
    const found = ZHIPUAI_MODELS.find(m => m.value === model)
    return found?.label ?? model
  }
  if (provider === 'github') return 'GPT-5 Mini'
  if (provider === 'minimax') return 'M2.5'
  return model
}

function formatOllamaModelMeta(model: OllamaModelListItem): string | undefined {
  if (model.parameterSize) return model.parameterSize
  if (typeof model.size === 'number' && model.size > 0) {
    const gb = model.size / (1024 * 1024 * 1024)
    return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(model.size / (1024 * 1024)).toFixed(0)} MB`
  }
  return undefined
}

// --- Provider Selector ---

interface ProviderSelectorProps {
  provider: AIProvider
  onProviderChange: (value: AIProvider) => void
  isLoading: boolean
}

export const ProviderSelector = React.memo<ProviderSelectorProps>(
  ({ provider, onProviderChange, isLoading }) => {
    const [open, setOpen] = React.useState(false)

    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={isLoading}
            className="h-auto gap-1 px-0 py-1 font-normal text-muted-foreground hover:text-foreground"
          >
            {PROVIDER_LABELS[provider]}
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuRadioGroup
            value={provider}
            onValueChange={v => onProviderChange(v as AIProvider)}
          >
            {(Object.keys(PROVIDER_LABELS) as AIProvider[]).map(p => (
              <DropdownMenuRadioItem
                key={p}
                value={p}
                className={cn(
                  'cursor-pointer',
                  provider === p &&
                    `relative z-10 font-medium ring-2 ring-offset-1 ${PROVIDER_STYLES[p]}`
                )}
              >
                <div className="flex flex-col">
                  <span>{PROVIDER_LABELS[p]}</span>
                  <span className="text-muted-foreground text-xs">{PROVIDER_DESCRIPTIONS[p]}</span>
                </div>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
)
ProviderSelector.displayName = 'ProviderSelector'

// --- Ollama Model Selector ---

interface OllamaModelSelectorProps {
  model: string
  onModelChange: (value: string) => void
  ollamaModels: OllamaModelListItem[]
  isLoading: boolean
  isLoadingOllamaModels: boolean
}

export const OllamaModelSelector = React.memo<OllamaModelSelectorProps>(
  ({ model, onModelChange, ollamaModels, isLoading, isLoadingOllamaModels }) => {
    const [open, setOpen] = React.useState(false)
    const availableModels = ollamaModels.length > 0 ? ollamaModels : FALLBACK_OLLAMA_MODELS
    const textOnly = availableModels.filter(item => !item.supportsVision)
    const vision = availableModels.filter(item => item.supportsVision)

    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={isLoading}
            className="h-auto gap-1 px-0 py-1 font-normal text-muted-foreground hover:text-foreground"
          >
            {model}
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuRadioGroup value={model} onValueChange={onModelChange}>
            {textOnly.length > 0 && (
              <>
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  文本
                </DropdownMenuLabel>
                {textOnly.map(item => (
                  <DropdownMenuRadioItem
                    key={item.name}
                    value={item.name}
                    className={cn(
                      'cursor-pointer',
                      model === item.name &&
                        'bg-primary/10 ring-primary relative z-10 font-medium ring-2 ring-offset-1'
                    )}
                  >
                    <div className="flex flex-col">
                      <span>{item.name}</span>
                      {formatOllamaModelMeta(item) && (
                        <span className="text-muted-foreground text-xs">
                          {formatOllamaModelMeta(item)}
                        </span>
                      )}
                    </div>
                  </DropdownMenuRadioItem>
                ))}
              </>
            )}
            {textOnly.length > 0 && vision.length > 0 && <DropdownMenuSeparator />}
            {vision.length > 0 && (
              <>
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  图像
                </DropdownMenuLabel>
                {vision.map(item => (
                  <DropdownMenuRadioItem
                    key={item.name}
                    value={item.name}
                    className={cn(
                      'cursor-pointer',
                      model === item.name &&
                        'bg-primary/10 ring-primary relative z-10 font-medium ring-2 ring-offset-1'
                    )}
                  >
                    <div className="flex flex-col">
                      <span>{item.name}</span>
                      {formatOllamaModelMeta(item) && (
                        <span className="text-muted-foreground text-xs">
                          {formatOllamaModelMeta(item)}
                        </span>
                      )}
                    </div>
                  </DropdownMenuRadioItem>
                ))}
              </>
            )}
          </DropdownMenuRadioGroup>
          {isLoadingOllamaModels && (
            <div className="text-muted-foreground px-2 py-1 text-xs">
              正在读取本地 Ollama 模型...
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
)
OllamaModelSelector.displayName = 'OllamaModelSelector'

// --- Zhipuai Model Selector ---

interface ZhipuaiModelSelectorProps {
  model: string
  onModelChange: (value: string) => void
  isLoading: boolean
}

export const ZhipuaiModelSelector = React.memo<ZhipuaiModelSelectorProps>(
  ({ model, onModelChange, isLoading }) => {
    const [open, setOpen] = React.useState(false)

    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={isLoading}
            className="h-auto gap-1 px-0 py-1 font-normal text-muted-foreground hover:text-foreground"
          >
            {getModelLabel('zhipuai', model)}
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuRadioGroup value={model} onValueChange={onModelChange}>
            {ZHIPUAI_MODELS.map(m => (
              <DropdownMenuRadioItem key={m.value} value={m.value} className="cursor-pointer">
                <div className="flex flex-col">
                  <span>{m.label}</span>
                  <span className="text-muted-foreground text-xs">{m.desc}</span>
                </div>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
)
ZhipuaiModelSelector.displayName = 'ZhipuaiModelSelector'
