'use client'

import React from 'react'
import { Globe, RefreshCw, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useLanguageDetection } from '@/hooks/useTranslation'
import { cn } from '@/lib/helpers'

interface LanguageDetectionStatusProps {
  className?: string
  showDetails?: boolean
  compact?: boolean
}

// 语言检测状态指示组件（精简版）
export function LanguageDetectionStatus({
  className,
  showDetails = true,
  compact = false,
}: LanguageDetectionStatusProps) {
  const { isDetecting, detectionStats } = useLanguageDetection()

  // 置信度颜色
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500'
    if (confidence >= 0.6) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  // 检测方法标签
  const getMethodLabel = (method: string) => {
    const methodMap: Record<string, string> = {
      browser: '浏览器',
      geolocation: '定位',
      user_agent: 'UA',
      stored_preference: '偏好',
      default: '默认',
      none: '无',
    }
    return methodMap[method] || method
  }

  // 检测方法图标
  const getMethodIcon = (method: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      browser: <Globe className="h-3 w-3" />,
      geolocation: <Globe className="h-3 w-3" />,
      user_agent: <Info className="h-3 w-3" />,
      stored_preference: <CheckCircle className="h-3 w-3" />,
      default: <AlertCircle className="h-3 w-3" />,
      none: <AlertCircle className="h-3 w-3" />,
    }
    return iconMap[method] || <Info className="h-3 w-3" />
  }

  // 精简模式，仅显示小圆点和置信度
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center gap-1', className)}>
              {isDetecting ? (
                <RefreshCw className="text-muted-foreground h-3 w-3 animate-spin" />
              ) : (
                <div
                  className={cn(
                    'h-2 w-2 rounded-full',
                    getConfidenceColor(detectionStats.confidence)
                  )}
                />
              )}
              {showDetails && (
                <span className="text-muted-foreground text-xs">
                  {detectionStats.confidence > 0
                    ? `${Math.round(detectionStats.confidence * 100)}%`
                    : 'N/A'}
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              <div>方法: {getMethodLabel(detectionStats.method)}</div>
              <div>置信度: {Math.round(detectionStats.confidence * 100)}%</div>
              {detectionStats.timestamp && (
                <div>时间: {new Date(detectionStats.timestamp).toLocaleString()}</div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // 常规模式，仅显示检测信息
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {isDetecting ? (
        <>
          <RefreshCw className="text-muted-foreground h-3 w-3 animate-spin" />
          <span className="text-muted-foreground text-xs">检测中</span>
        </>
      ) : (
        <>
          {getMethodIcon(detectionStats.method)}
          <span className="text-muted-foreground text-xs">
            {getMethodLabel(detectionStats.method)}
          </span>
          {detectionStats.confidence > 0 && (
            <>
              <div
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  getConfidenceColor(detectionStats.confidence)
                )}
              />
              <span className="text-muted-foreground text-xs">
                {Math.round(detectionStats.confidence * 100)}%
              </span>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default LanguageDetectionStatus
