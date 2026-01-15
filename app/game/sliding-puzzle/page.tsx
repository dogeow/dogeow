'use client'

import React, { useMemo, useState, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { GameRulesDialog } from '@/components/ui/game-rules-dialog'
import Link from 'next/link'

// 使用动态导入的滑块拼图游戏组件
const SlidingPuzzle = dynamic(() => import('./components/SlidingPuzzle'), {
  ssr: false,
  loading: () => <div className="p-4 text-center">加载游戏中...</div>,
})

const GAME_RULES = [
  '将打乱的数字方块移动到正确位置',
  '点击与空白方块相邻的方块可以移动它',
  '按照顺序排列所有数字即可获胜',
  '支持键盘方向键控制',
  '可以选择3×3、4×4、5×5三种难度',
  '移动次数越少分数越高',
]

// 内部组件，使用 useSearchParams
function SlidingPuzzleGame() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const difficulty = useMemo(() => {
    const diffParam = searchParams.get('difficulty')
    if (!diffParam) return 3 as 3 | 4 | 5
    const level = parseInt(diffParam, 10) as 3 | 4 | 5
    return [3, 4, 5].includes(level) ? level : (3 as 3 | 4 | 5)
  }, [searchParams])
  const [gameKey, setGameKey] = useState(0)

  // 更新URL参数
  const updateUrlParams = (level: 3 | 4 | 5) => {
    const params = new URLSearchParams()
    params.set('difficulty', level.toString())
    router.replace(`?${params.toString()}`)
  }

  const startGame = (level: 3 | 4 | 5) => {
    console.log('开始游戏，难度:', level)
    setGameKey(prev => prev + 1) // 重置游戏实例
    updateUrlParams(level)
  }

  const restartGame = () => {
    setGameKey(prev => prev + 1) // 重置游戏实例
  }

  // 处理游戏完成
  const handleGameComplete = () => {
    console.log('游戏完成！')
    alert(`恭喜！你完成了 ${difficulty}×${difficulty} 的拼图！`)
  }

  return (
    <div className="flex flex-col items-center px-2 py-4">
      <div className="mb-4 flex w-full max-w-md items-center justify-between">
        <div className="text-muted-foreground text-sm">
          <Link href="/game" className="hover:text-foreground transition-colors">
            游戏中心
          </Link>
          <span className="mx-1">{'>'}</span>{' '}
          <span className="text-foreground font-medium">滑块拼图</span>
        </div>
        <GameRulesDialog title="滑块拼图游戏规则" rules={GAME_RULES} />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={difficulty === 3 ? 'default' : 'outline'}
              size="sm"
              onClick={() => startGame(3)}
            >
              3×3
            </Button>
            <Button
              variant={difficulty === 4 ? 'default' : 'outline'}
              size="sm"
              onClick={() => startGame(4)}
            >
              4×4
            </Button>
            <Button
              variant={difficulty === 5 ? 'default' : 'outline'}
              size="sm"
              onClick={() => startGame(5)}
            >
              5×5
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={restartGame}>
            重新开始
          </Button>
        </div>

        {/* 使用key强制重新渲染 */}
        <div key={`game-${difficulty}-${gameKey}`}>
          <SlidingPuzzle size={difficulty} onComplete={handleGameComplete} />
        </div>
      </div>
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
