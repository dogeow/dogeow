'use client'

import React from 'react'
import { Globe, RefreshCw, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useLanguageDetection } from '@/hooks/useTranslation'
import { cn } from '@/lib/helpers'

interface LanguageDetectionStatusProps {
  className?: string
  showDetails?: boolean
  compact?: boolean
}

/**
 * Language detection status indicator component
 * Shows current detection status, confidence, and method
 */
export function LanguageDetectionStatus({
  className,
  showDetails = true,
  compact = false,
}: LanguageDetectionStatusProps) {
  const {
    isDetecting,
    detectedLanguage,
    isAutoDetected,
    detectionStats,
    refreshDetection,
    resetToDetected,
  } = useLanguageDetection()

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500'
    if (confidence >= 0.6) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getMethodLabel = (method: string) => {
    const methodMap: Record<string, string> = {
      browser: '浏览器设置',
      geolocation: '地理位置',
      user_agent: '用户代理',
      stored_preference: '用户偏好',
      default: '默认设置',
      none: '未检测',
    }
    return methodMap[method] || method
  }

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
              <div>检测方法: {getMethodLabel(detectionStats.method)}</div>
              <div>置信度: {Math.round(detectionStats.confidence * 100)}%</div>
              {detectionStats.timestamp && (
                <div>检测时间: {new Date(detectionStats.timestamp).toLocaleString()}</div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Detection status indicator */}
      <div className="flex items-center gap-2">
        {isDetecting ? (
          <div className="flex items-center gap-1">
            <RefreshCw className="text-muted-foreground h-4 w-4 animate-spin" />
            <span className="text-muted-foreground text-xs">检测中...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {getMethodIcon(detectionStats.method)}
              <span className="text-muted-foreground text-xs">
                {getMethodLabel(detectionStats.method)}
              </span>
            </div>

            {/* Confidence indicator */}
            {detectionStats.confidence > 0 && (
              <div className="flex items-center gap-1">
                <div
                  className={cn(
                    'h-2 w-2 rounded-full',
                    getConfidenceColor(detectionStats.confidence)
                  )}
                />
                <span className="text-muted-foreground text-xs">
                  {Math.round(detectionStats.confidence * 100)}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {showDetails && !isDetecting && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshDetection}
            disabled={isDetecting}
            className="hover:bg-muted h-6 w-6 p-0"
            title="重新检测语言"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>

          {detectedLanguage && !isAutoDetected && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToDetected}
              className="hover:bg-muted h-6 w-6 p-0"
              title="切换到检测到的语言"
            >
              <Globe className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      {/* Auto-detection badge */}
      {isAutoDetected && (
        <Badge variant="secondary" className="text-xs">
          <Globe className="mr-1 h-2 w-2" />
          自动检测
        </Badge>
      )}

      {/* Detection timestamp */}
      {showDetails && detectionStats.timestamp && (
        <span className="text-muted-foreground text-xs">
          {new Date(detectionStats.timestamp).toLocaleDateString()}
        </span>
      )}
    </div>
  )
}

export default LanguageDetectionStatus
