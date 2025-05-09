"use client"

import React, { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"

// 使用动态导入的滑块拼图游戏组件
const SlidingPuzzle = dynamic(
  () => import("./components/SlidingPuzzle"),
  {
    ssr: false,
    loading: () => <div className="p-4 text-center">加载游戏中...</div>,
  }
)

// 内部组件，使用 useSearchParams
function SlidingPuzzleGame() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // 从URL获取难度级别
  const difficultyParam = searchParams.get('difficulty')
  const initialDifficulty = difficultyParam ? 
    (parseInt(difficultyParam) as 3 | 4 | 5) : 3
  
  const [difficulty, setDifficulty] = useState<3 | 4 | 5>(
    [3, 4, 5].includes(initialDifficulty) ? initialDifficulty : 3
  )
  const [isPlaying, setIsPlaying] = useState(!!difficultyParam)
  const [gameKey, setGameKey] = useState(0)
  
  // 更新URL参数
  const updateUrlParams = (isPlaying: boolean, level?: 3 | 4 | 5) => {
    if (isPlaying && level) {
      const params = new URLSearchParams()
      params.set('difficulty', level.toString())
      router.push(`?${params.toString()}`)
    } else {
      router.push('/game/sliding-puzzle')
    }
  }
  
  const startGame = (level: 3 | 4 | 5) => {
    console.log('开始游戏，难度:', level)
    setDifficulty(level)
    setIsPlaying(true)
    setGameKey(prev => prev + 1) // 重置游戏实例
    updateUrlParams(true, level)
  }
  
  const backToMenu = () => {
    setIsPlaying(false)
    updateUrlParams(false)
  }
  
  // 监听URL参数变化
  useEffect(() => {
    const diffParam = searchParams.get('difficulty')
    if (diffParam) {
      const level = parseInt(diffParam) as 3 | 4 | 5
      if ([3, 4, 5].includes(level) && (!isPlaying || level !== difficulty)) {
        setDifficulty(level)
        setIsPlaying(true)
        console.log('从URL参数加载游戏，难度:', level)
      }
    }
  }, [searchParams, difficulty, isPlaying])
  
  // 处理游戏完成
  const handleGameComplete = () => {
    console.log('游戏完成！')
    alert(`恭喜！你完成了 ${difficulty}×${difficulty} 的拼图！`)
  }
  
  return (
    <div className="flex flex-col items-center py-4 px-2">
      <h1 className="text-2xl font-bold mb-4">滑块拼图游戏</h1>
      
      {!isPlaying ? (
        <Card className="p-6 max-w-md w-full">
          <div className="text-center mb-4">
            <p className="mb-4">选择难度并开始游戏：</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4 justify-center">
              <Button 
                onClick={() => startGame(3)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                简单 (3×3)
              </Button>
              <Button 
                onClick={() => startGame(4)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                中等 (4×4)
              </Button>
              <Button 
                onClick={() => startGame(5)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                困难 (5×5)
              </Button>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <p>游戏规则：</p>
            <ul className="list-disc pl-5 mt-2">
              <li>将打乱的数字方块移动到正确位置</li>
              <li>点击与空白方块相邻的方块可以移动它</li>
              <li>按照顺序排列所有数字即可获胜</li>
            </ul>
          </div>
        </Card>
      ) : (
        <div className="w-full max-w-md">
          <Button 
            variant="outline" 
            onClick={backToMenu}
            className="mb-4"
          >
            返回菜单
          </Button>
          
          {/* 使用key强制重新渲染 */}
          <div key={`game-${difficulty}-${gameKey}`}>
            <SlidingPuzzle 
              size={difficulty} 
              onComplete={handleGameComplete}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// 主页面组件，使用 Suspense 包裹
export default function SlidingPuzzlePage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">加载中...</div>}>
      <SlidingPuzzleGame />
    </Suspense>
  )
} 