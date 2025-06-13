"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { configs } from "@/app/configs"

export default function GamePage() {
  const games = configs.games

  return (
    <div className="container py-4 px-4">
      <h1 className="text-3xl font-bold mb-6">游戏中心</h1>
      
      <div className="flex flex-wrap gap-4 justify-center">
        {games.map((game) => (
          <Link 
            href={`/game/${game.id}`} 
            key={game.id}
            className={`flex-shrink-0 w-28 sm:w-36 lg:w-40 ${game.hideOnMobile ? "hidden md:block" : ""}`}
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