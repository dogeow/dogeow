'use client'

import { BackButton } from '@/components/ui/back-button'
import MazeGame from './components/MazeGame'

export default function MazePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* 头部 */}
        <div className="mb-6 flex items-center gap-4">
          <BackButton onClick={() => window.history.back()} />
          <h1 className="text-2xl font-bold text-gray-800">迷宫游戏</h1>
        </div>

        {/* 游戏区域 */}
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <MazeGame />
        </div>
      </div>
    </div>
  )
}
