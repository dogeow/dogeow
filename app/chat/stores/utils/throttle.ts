/**
 * 防抖和节流工具函数
 */

/**
 * 创建节流函数
 */
export const createThrottledFunction = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T => {
  let loading = false
  let lastLoadTime = 0

  return ((...args: Parameters<T>) => {
    const now = Date.now()
    if (loading || now - lastLoadTime < delay) {
      console.log(`Throttled function call skipped (${fn.name})`)
      return Promise.resolve()
    }

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
  }) as T
}
