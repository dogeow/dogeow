import { type ChatApiError } from '@/lib/api/chat-error-handler'

export interface ErrorReport {
  id: string
  error: ChatApiError
  context: {
    url: string
    userAgent: string
    timestamp: Date
    userId?: string
    roomId?: string
    sessionId: string
  }
  stackTrace?: string
  additionalData?: Record<string, unknown>
}

export interface ErrorReportingConfig {
  enabled: boolean
  endpoint?: string
  maxReports: number
  reportingInterval: number
  includeStackTrace: boolean
  includeBrowserInfo: boolean
  includeUserInfo: boolean
}

class ErrorReportingService {
  private config: ErrorReportingConfig = {
    enabled: process.env.NODE_ENV === 'production',
    endpoint: process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT,
    maxReports: 100,
    reportingInterval: 30000, // 30秒
    includeStackTrace: true,
    includeBrowserInfo: true,
    includeUserInfo: false, // 隐私考虑
  }

  private reportQueue: ErrorReport[] = []
  private sessionId: string
  private reportingTimer: NodeJS.Timeout | null = null

  constructor(config?: Partial<ErrorReportingConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }

    this.sessionId = this.generateSessionId()

    if (this.config.enabled) {
      this.startReporting()
    }
  }

  public reportError(error: ChatApiError, additionalContext?: Record<string, unknown>): void {
    if (!this.config.enabled) {
      return
    }

    const report: ErrorReport = {
      id: this.generateReportId(),
      error,
      context: this.buildContext(additionalContext),
      stackTrace: this.config.includeStackTrace ? this.getStackTrace() : undefined,
      additionalData: additionalContext,
    }

    this.addToQueue(report)
  }

  private buildContext(additionalContext?: Record<string, unknown>): ErrorReport['context'] {
    const context: ErrorReport['context'] = {
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: new Date(),
      sessionId: this.sessionId,
    }

    // 如果允许并且有userId，则添加用户ID
    if (this.config.includeUserInfo && additionalContext?.userId) {
      context.userId = String(additionalContext.userId)
    }

    // 如果有roomId，则添加房间ID
    if (additionalContext?.roomId) {
      context.roomId = String(additionalContext.roomId)
    }

    return context
  }

  private getStackTrace(): string | undefined {
    try {
      throw new Error()
    } catch (e) {
      return e instanceof Error ? e.stack : undefined
    }
  }

  private addToQueue(report: ErrorReport): void {
    this.reportQueue.push(report)

    // 保持队列大小不超过最大限制
    if (this.reportQueue.length > this.config.maxReports) {
      this.reportQueue = this.reportQueue.slice(-this.config.maxReports)
    }

    // 开发环境下本地打印日志
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Report')
      console.error('Error:', report.error)
      console.log('Context:', report.context)
      if (report.additionalData) {
        console.log('Additional Data:', report.additionalData)
      }
      console.groupEnd()
    }
  }

  private startReporting(): void {
    if (this.reportingTimer) {
      return
    }

    this.reportingTimer = setInterval(() => {
      this.sendReports()
    }, this.config.reportingInterval)

    // 页面即将卸载时发送错误报告
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.sendReports(true)
      })

      // 页面变为隐藏时（如切换标签/移动端）发送错误报告
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.sendReports()
        }
      })
    }
  }

  private async sendReports(isBeforeUnload: boolean = false): Promise<void> {
    if (this.reportQueue.length === 0 || !this.config.endpoint) {
      return
    }

    const reportsToSend = [...this.reportQueue]
    this.reportQueue = []

    try {
      const payload = {
        reports: reportsToSend,
        metadata: {
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          url: typeof window !== 'undefined' ? window.location.href : '',
        },
      }

      if (isBeforeUnload && 'sendBeacon' in navigator) {
        // 页面卸载时使用sendBeacon保证数据可靠发送
        navigator.sendBeacon(this.config.endpoint, JSON.stringify(payload))
      } else {
        // 正常上报时使用fetch
        await fetch(this.config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })
      }

      console.log(`已发送${reportsToSend.length}条错误报告`)
    } catch (error) {
      // 发送失败时，将报告重新放回队列（最多保留一半）
      this.reportQueue = [
        ...reportsToSend.slice(-this.config.maxReports / 2),
        ...this.reportQueue,
      ].slice(-this.config.maxReports)

      console.warn('发送错误报告失败:', error)
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  public getQueuedReports(): ErrorReport[] {
    return [...this.reportQueue]
  }

  public clearQueue(): void {
    this.reportQueue = []
  }

  public updateConfig(config: Partial<ErrorReportingConfig>): void {
    this.config = { ...this.config, ...config }

    if (this.config.enabled && !this.reportingTimer) {
      this.startReporting()
    } else if (!this.config.enabled && this.reportingTimer) {
      this.stopReporting()
    }
  }

  public stopReporting(): void {
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer)
      this.reportingTimer = null
    }

    // 停止时发送剩余的错误报告
    if (this.reportQueue.length > 0) {
      this.sendReports()
    }
  }

  public destroy(): void {
    this.stopReporting()
    this.reportQueue = []
  }
}

// 单例实例
const errorReportingService = new ErrorReportingService()

export default errorReportingService

// 便捷函数
export const reportChatError = (error: ChatApiError, context?: Record<string, unknown>): void => {
  errorReportingService.reportError(error, context)
}

export const configureErrorReporting = (config: Partial<ErrorReportingConfig>): void => {
  errorReportingService.updateConfig(config)
}

export const getErrorReports = (): ErrorReport[] => {
  return errorReportingService.getQueuedReports()
}

export const clearErrorReports = (): void => {
  errorReportingService.clearQueue()
}
