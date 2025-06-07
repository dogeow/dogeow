"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"

export default function GamePage() {
  const games = [
    {
      id: "sliding-puzzle",
      name: "滑块拼图",
      description: "经典的数字滑块拼图游戏，锻炼你的逻辑思维和耐心。通过移动方块将数字排列成正确顺序。",
      difficulty: "简单到中等",
      icon: "🧩"
    },
    {
      id: "shooting-range",
      name: "射击训练场",
      description: "3D第一人称射击游戏，测试你的反应速度和瞄准精度。使用鼠标控制瞄准并击中目标。",
      difficulty: "中等",
      icon: "🎯",
      hideOnMobile: true // 标记在移动端隐藏
    },
    {
      id: "2048",
      name: "2048",
      description: "经典的数字合并游戏，通过滑动方块合并相同数字，目标是达到2048。支持触摸和键盘操作。",
      difficulty: "简单到困难",
      icon: "🔢"
    },
    {
      id: "snake",
      name: "贪吃蛇",
      description: "经典的贪吃蛇游戏，控制蛇吃食物并避免撞墙和撞自己。支持触摸滑动和键盘控制。",
      difficulty: "简单到中等",
      icon: "🐍"
    },
    {
      id: "minesweeper",
      name: "扫雷",
      description: "经典的扫雷游戏，通过数字提示找出所有地雷位置。支持三种难度级别和右键标记功能。",
      difficulty: "简单到困难",
      icon: "💣"
    },
    // 未来可以添加更多游戏
  ]

  return (
    <div className="container py-4 px-4">
      <h1 className="text-3xl font-bold mb-6">游戏中心</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <Link 
            href={`/game/${game.id}`} 
            key={game.id}
            className={game.hideOnMobile ? "hidden md:block" : ""}
          >
            <Card className="p-6 h-full transition-all hover:shadow-md hover:-translate-y-1">
              <div className="flex flex-col h-full">
                <div className="text-4xl mb-4">{game.icon}</div>
                <h2 className="text-xl font-semibold mb-2">{game.name}</h2>
                <p className="text-gray-600 text-sm mb-3 flex-grow">{game.description}</p>
                <div className="mt-auto">
                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                    难度: {game.difficulty}
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}