import { useState, useEffect } from 'react'

interface TimerProps {
  startTime: Date
  isComplete: boolean
}

/**
 * 计时器组件
 */
export function Timer({ startTime, isComplete }: TimerProps) {
  const [time, setTime] = useState(0)

  useEffect(() => {
    if (isComplete) return

    const interval = setInterval(() => {
      const now = new Date()
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000)
      setTime(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime, isComplete])

  const minutes = Math.floor(time / 60)
  const seconds = time % 60

  return (
    <div className="text-center font-mono">
      <div className="text-sm text-gray-500">用时</div>
      <div className="font-semibold">
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </div>
    </div>
  )
}
