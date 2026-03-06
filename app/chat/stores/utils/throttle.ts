/**
 * 防抖和节流工具函数
 */

/**
 * 创建节流函数（支持尾随调用）
 * @param fn 要节流的函数
 * @param delay 节流延迟（毫秒）
 * @param options 配置选项
 */
export const createThrottledFunction = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): T => {
  const { leading = true, trailing = true } = options
  let loading = false
  let lastLoadTime = 0
  let timeoutId: NodeJS.Timeout | null = null
  let lastArgs: Parameters<T> | null = null

  return ((...args: Parameters<T>) => {
    const now = Date.now()
    const timeSinceLastCall = now - lastLoadTime

    // 保存最新的参数用于尾随调用
    lastArgs = args

    // 如果正在加载或未超过延迟时间
    if (loading || timeSinceLastCall < delay) {
      // 清除之前的尾随调用
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }

      // 设置尾随调用
      if (trailing && !loading) {
        const remainingTime = delay - timeSinceLastCall
        timeoutId = setTimeout(() => {
          if (lastArgs) {
            lastLoadTime = Date.now()
            loading = true
            const result = fn(...lastArgs)
            if (result instanceof Promise) {
              result.finally(() => {
                loading = false
              })
            } else {
              loading = false
            }
          }
          timeoutId = null
        }, remainingTime)
      }

      console.log(`Throttled function call ${leading ? 'queued' : 'skipped'} (${fn.name})`)
      return Promise.resolve()
    }

    // 执行前导调用
    if (leading) {
      loading = true
      lastLoadTime = now

      const result = fn(...args)
      if (result instanceof Promise) {
        return result.finally(() => {
          loading = false
        })
      } else {
        loading = false
        return result
      }
    }

    return Promise.resolve()
  }) as T
}
