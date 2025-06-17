"use client"

import { MazeGame } from "./components/MazeGame"

export default function MazePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🌀 迷宫游戏</h1>
          <p className="text-slate-300">
            PC端使用WASD或方向键控制，手机端使用手势滑动控制小球
          </p>
        </div>
        <MazeGame />
      </div>
    </div>
  )
} 