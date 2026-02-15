import { useState, useEffect, useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { DEFAULT_FORMAT, CURRENT_TIME_UPDATE_INTERVAL } from '../constants'

interface UseCurrentTimeOptions {
  updateInterval?: number
  formatString?: string
}

interface CurrentTime {
  timestamp: number
  dateTime: string
  isoString: string
}

export const useCurrentTime = (options: UseCurrentTimeOptions = {}) => {
  const { updateInterval = CURRENT_TIME_UPDATE_INTERVAL, formatString = DEFAULT_FORMAT } = options

  // 使用函数式更新避免依赖
  const [currentTime, setCurrentTime] = useState<CurrentTime>(() => {
    const now = new Date()
    return {
      timestamp: Math.floor(now.getTime() / 1000),
      dateTime: format(now, formatString, { locale: zhCN }),
      isoString: now.toISOString(),
    }
  })

  const updateCurrentTime = useCallback(() => {
    const now = new Date()
    setCurrentTime({
      timestamp: Math.floor(now.getTime() / 1000),
      dateTime: format(now, formatString, { locale: zhCN }),
      isoString: now.toISOString(),
    })
  }, [formatString])

  useEffect(() => {
    const timer = setInterval(updateCurrentTime, updateInterval)
    return () => clearInterval(timer)
  }, [updateInterval, updateCurrentTime])

  // 缓存格式化函数，避免每次渲染都创建新函数
  const formatTimestamp = useCallback(
    (ts: number, fmt: string = formatString) => {
      return format(new Date(ts * 1000), fmt, { locale: zhCN })
    },
    [formatString]
  )

  // 返回原始值和格式化函数
  return useMemo(
    () => ({
      currentTimestamp: currentTime.timestamp,
      currentDateTime: currentTime.dateTime,
      currentIsoString: currentTime.isoString,
      updateCurrentTime,
      formatTimestamp,
    }),
    [currentTime, updateCurrentTime, formatTimestamp]
  )
}

// 分离时间戳显示 - 用于不需要每秒更新的场景
export const useCurrentTimestamp = () => {
  const [timestamp, setTimestamp] = useState(() => Math.floor(Date.now() / 1000))

  useEffect(() => {
    const timer = setInterval(() => {
      setTimestamp(Math.floor(Date.now() / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return timestamp
}
