'use client'

import Link from 'next/link'
import { GameRulesDialog } from '@/components/ui/game-rules-dialog'
import MazeGame from './components/MazeGame'

export default function MazePage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* 头部 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="text-muted-foreground text-sm">
            <Link href="/game" className="hover:text-foreground transition-colors">
              游戏中心
            </Link>
            <span className="mx-1">{'>'}</span>{' '}
            <span className="text-foreground font-medium">迷宫游戏</span>
          </div>
          <GameRulesDialog
            title="迷宫游戏说明"
            rules={[
              '点击迷宫中的任意位置，小球会自动寻路到达',
              '移动过程中可以随时点击其他位置来中断并重新导航',
              '使用方向键或 WASD 键控制小球移动（会中断自动移动）',
              '将蓝色小球移动到右下角的红色终点即可获胜',
              '绿色方块是起点，红色方块是终点',
            ]}
          />
        </div>

        {/* 游戏区域 */}
        <MazeGame />
      </div>
    </div>
  )
}
