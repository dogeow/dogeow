"use client"

import { Suspense, useState, useEffect } from "react"
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

  // 防止空格键引起页面滚动
  useEffect(() => {
    const preventSpacebarScroll = (e: KeyboardEvent) => {
      // 如果按下空格键
      if (e.code === 'Space' || e.key === ' ') {
        // 阻止默认行为（滚动）
        e.preventDefault();
        return false;
      }
    };

    // 添加事件监听器
    window.addEventListener('keydown', preventSpacebarScroll);

    // 清理函数移除事件监听器
    return () => {
      window.removeEventListener('keydown', preventSpacebarScroll);
    };
  }, []);

  // 处理返回设置按钮点击，确保释放指针锁定
  const handleBackToSettings = () => {
    // 尝试释放指针锁定
    if (document.exitPointerLock) {
      document.exitPointerLock();
    } else if ((document as any).mozExitPointerLock) {
      (document as any).mozExitPointerLock();
    } else if ((document as any).webkitExitPointerLock) {
      (document as any).webkitExitPointerLock();
    }
    
    // 设置一个短暂的延迟，确保指针锁释放后再更改状态
    setTimeout(() => {
      setIsStarted(false);
    }, 50);
  }

  return (
    <div className="w-full py-8">
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
        <div className="relative w-full h-[90vh]">
          <div className="h-full w-full rounded-lg overflow-hidden relative">
            <Suspense fallback={<div className="flex justify-center items-center h-full">加载游戏中...</div>}>
              <ShootingGame difficulty={difficulty} setGameStarted={setIsStarted} />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  )
} 