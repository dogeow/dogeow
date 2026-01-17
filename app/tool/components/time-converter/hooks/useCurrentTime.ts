import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { DEFAULT_FORMAT, CURRENT_TIME_UPDATE_INTERVAL } from '../constants'

export const useCurrentTime = () => {
  const initialNow = new Date()
  const [currentTimestamp, setCurrentTimestamp] = useState(() =>
    Math.floor(initialNow.getTime() / 1000)
  )
  const [currentDateTime, setCurrentDateTime] = useState(() =>
    format(initialNow, DEFAULT_FORMAT, { locale: zhCN })
  )

  const updateCurrentTime = useCallback(() => {
    const now = new Date()
    setCurrentTimestamp(Math.floor(now.getTime() / 1000))
    setCurrentDateTime(format(now, DEFAULT_FORMAT, { locale: zhCN }))
  }, [])

  useEffect(() => {
    const timer = setInterval(updateCurrentTime, CURRENT_TIME_UPDATE_INTERVAL)
    return () => clearInterval(timer)
  }, [updateCurrentTime])

  return { currentTimestamp, currentDateTime, updateCurrentTime }
}
