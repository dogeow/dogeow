"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface SimplePuzzleProps {
  size: 3 | 4 | 5
  onComplete: () => void
}

export default function SimplePuzzle({ size, onComplete }: SimplePuzzleProps) {
  const [count, setCount] = useState(0)
  
  return (
    <Card className="p-6 w-full">
      <div className="text-center">
        <h2 className="text-xl mb-4">简化版滑块拼图游戏 ({size}×{size})</h2>
        <p className="mb-4">点击次数: {count}</p>
        
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
          {Array.from({ length: size * size - 1 }).map((_, i) => (
            <Button 
              key={i} 
              onClick={() => setCount(c => c + 1)}
              className="h-12 aspect-square flex items-center justify-center"
            >
              {i + 1}
            </Button>
          ))}
          <div className="border border-dashed rounded-md flex items-center justify-center">
            空格
          </div>
        </div>
        
        <Button 
          className="mt-4"
          onClick={() => {
            onComplete()
            alert("测试成功！")
          }}
        >
          完成游戏
        </Button>
      </div>
    </Card>
  )
} 