"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"

export default function GamePage() {
  const games = [
    {
      id: "sliding-puzzle",
      name: "滑块拼图",
      icon: "🧩"
    },
    {
      id: "picture-puzzle",
      name: "图片拼图",
      icon: "🖼️"
    },
    {
      id: "jigsaw-puzzle",
      name: "传统拼图",
      icon: "🧩"
    },
    {
      id: "shooting-range",
      name: "射击训练场",
      icon: "🎯",
      hideOnMobile: true // 标记在移动端隐藏
    },
    {
      id: "tetris",
      name: "俄罗斯方块",
      icon: "🧱"
    },
    {
      id: "2048",
      name: "2048",
      icon: "🔢"
    },
    {
      id: "snake",
      name: "贪吃蛇",
      icon: "🐍"
    },
    {
      id: "minesweeper",
      name: "扫雷",
      icon: "💣"
    },
    {
      id: "tic-tac-toe",
      name: "井字棋",
      icon: "⭕"
    },
  ]

  return (
    <div className="container py-4 px-4">
      <h1 className="text-3xl font-bold mb-6">游戏中心</h1>
      
      <div className="grid grid-cols-3 gap-4">
        {games.map((game) => (
          <Link 
            href={`/game/${game.id}`} 
            key={game.id}
            className={game.hideOnMobile ? "hidden md:block" : ""}
          >
            <Card className="aspect-square p-4 transition-all hover:shadow-md hover:-translate-y-1 flex flex-col items-center justify-center text-center">
              <div className="text-4xl mb-2">{game.icon}</div>
              <h2 className="text-sm font-medium">{game.name}</h2>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}