"use client"

import { useEffect, useState } from "react"

interface TimerProps {
  startTime: Date
}

export function Timer({ startTime }: TimerProps) {
  const [elapsedTime, setElapsedTime] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const timeElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000)
      setElapsedTime(timeElapsed)
    }, 1000)
    
    return () => clearInterval(interval)
  }, [startTime])
  
  // 格式化时间为 mm:ss
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  
  return (
    <div className="text-center font-mono">
      <div className="text-sm text-gray-500">用时</div>
      <div className="font-semibold">{formatTime(elapsedTime)}</div>
    </div>
  )
} 