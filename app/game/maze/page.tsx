"use client"

import { BackButton } from '@/components/ui/back-button'
import MazeGame from './components/MazeGame'

export default function MazePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* 头部 */}
        <div className="flex items-center gap-4 mb-6">
          <BackButton onClick={() => window.history.back()} />
          <h1 className="text-2xl font-bold text-gray-800">3D 迷宫游戏</h1>
        </div>

        {/* 游戏区域 */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <MazeGame />
        </div>
      </div>
    </div>
  )
} 