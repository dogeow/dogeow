"use client"

interface MoveCounterProps {
  moves: number
}

export function MoveCounter({ moves }: MoveCounterProps) {
  return (
    <div className="text-center">
      <div className="text-sm text-gray-500">移动次数</div>
      <div className="font-semibold">{moves}</div>
    </div>
  )
} 