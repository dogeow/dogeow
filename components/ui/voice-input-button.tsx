'use client'

import { Button } from '@/components/ui/button'
import { Mic, MicOff } from 'lucide-react'
import { cn } from '@/lib/helpers'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export interface VoiceInputButtonProps {
  isListening: boolean
  isSupported: boolean
  onToggle: () => void
  disabled?: boolean
  className?: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  showTooltip?: boolean
}

export function VoiceInputButton({
  isListening,
  isSupported,
  onToggle,
  disabled = false,
  className,
  size = 'icon',
  variant = 'ghost',
  showTooltip = true,
}: VoiceInputButtonProps) {
  const button = (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={onToggle}
      disabled={disabled || !isSupported}
      className={cn(
        'transition-all',
        isListening &&
          'animate-pulse bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700',
        !isSupported && 'cursor-not-allowed opacity-50',
        className
      )}
      aria-label={isListening ? '停止语音输入' : '开始语音输入'}
      title={isListening ? '停止语音输入' : '开始语音输入'}
    >
      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </Button>
  )

  if (!showTooltip) {
    return button
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>
          {!isSupported
            ? '您的浏览器不支持语音识别'
            : isListening
              ? '点击停止语音输入'
              : '点击开始语音输入'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
