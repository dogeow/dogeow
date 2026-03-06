/**
 * WebSocket 消息批处理工具
 * 用于合并短时间内的多个状态更新，减少重新渲染次数
 */

interface BatchUpdate {
  type: string
  data: Record<string, unknown>
  timestamp: number
}

export class MessageBatchProcessor {
  private updates: BatchUpdate[] = []
  private timeoutId: NodeJS.Timeout | null = null
  private readonly batchDelay: number
  private readonly processCallback: (updates: BatchUpdate[]) => void

  constructor(processCallback: (updates: BatchUpdate[]) => void, batchDelay: number = 50) {
    this.processCallback = processCallback
    this.batchDelay = batchDelay
  }

  /**
   * 添加更新到批处理队列
   */
  addUpdate(type: string, data: Record<string, unknown>): void {
    this.updates.push({
      type,
      data,
      timestamp: Date.now(),
    })

    // 重置定时器
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
    }

    // 设置新的批处理定时器
    this.timeoutId = setTimeout(() => {
      this.flush()
    }, this.batchDelay)
  }

  /**
   * 立即处理所有待处理的更新
   */
  flush(): void {
    if (this.updates.length === 0) return

    const updates = [...this.updates]
    this.updates = []

    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }

    this.processCallback(updates)
  }

  /**
   * 清除所有待处理的更新
   */
  clear(): void {
    this.updates = []
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
  }

  /**
   * 获取待处理更新数量
   */
  getPendingCount(): number {
    return this.updates.length
  }
}

/**
 * 合并相同类型的更新
 */
export function mergeUpdates(updates: BatchUpdate[]): BatchUpdate[] {
  const merged = new Map<string, BatchUpdate>()

  for (const update of updates) {
    const roomId = 'roomId' in update.data ? String(update.data.roomId) : ''
    const key = `${update.type}-${roomId}`

    if (merged.has(key)) {
      merged.set(key, update)
    } else {
      merged.set(key, update)
    }
  }

  return Array.from(merged.values())
}
