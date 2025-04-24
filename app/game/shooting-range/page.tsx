"use client"

import { Suspense, useState } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// 动态导入ThreeJS组件以避免SSR问题
const ShootingGame = dynamic(() => import("./components/ShootingGame"), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96">加载中...</div>
})

export default function ShootingRangePage() {
  const [isStarted, setIsStarted] = useState(false)
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy")

  return (
    <div className="container py-8 px-4">
      {!isStarted ? (
        <Card className="p-6 max-w-md mx-auto">
          <h2 className="text-2xl font-semibold mb-4">游戏设置</h2>
          
          <div className="mb-4">
            <h3 className="font-medium mb-2">难度选择：</h3>
            <div className="flex gap-2">
              <Button 
                variant={difficulty === "easy" ? "default" : "outline"}
                onClick={() => setDifficulty("easy")}
              >
                简单
              </Button>
              <Button 
                variant={difficulty === "medium" ? "default" : "outline"}
                onClick={() => setDifficulty("medium")}
              >
                中等
              </Button>
              <Button 
                variant={difficulty === "hard" ? "default" : "outline"}
                onClick={() => setDifficulty("hard")}
              >
                困难
              </Button>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-medium mb-2">游戏说明：</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>使用鼠标移动瞄准目标</li>
              <li>点击鼠标左键射击</li>
              <li>尽可能快速准确地击中所有目标</li>
              <li>按ESC键暂停游戏</li>
            </ul>
          </div>

          <Button className="w-full" onClick={() => setIsStarted(true)}>
            开始游戏
          </Button>
        </Card>
      ) : (
        <div className="relative">
          <Button 
            variant="outline" 
            className="absolute top-2 left-2 z-10"
            onClick={() => setIsStarted(false)}
          >
            返回设置
          </Button>
          <div className="h-[80vh] w-full rounded-lg overflow-hidden border relative">
            <Suspense fallback={<div className="flex justify-center items-center h-full">加载游戏中...</div>}>
              <ShootingGame difficulty={difficulty} />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  )
} 