'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { configs } from '@/app/configs'

export default function GamePage() {
  const games = configs.games

  return (
    <div className="container px-4 py-4">
      <h1 className="mb-6 text-3xl font-bold">游戏中心</h1>

      <div className="flex flex-wrap justify-center gap-4">
        {games.map(game => (
          <Link
            href={`/game/${game.id}`}
            key={game.id}
            className={`w-28 flex-shrink-0 sm:w-36 lg:w-40 ${game.hideOnMobile ? 'hidden md:block' : ''}`}
          >
            <Card className="flex aspect-square flex-col items-center justify-center p-4 text-center transition-all hover:-translate-y-1 hover:shadow-md">
              <div className="mb-2 text-4xl">{game.icon}</div>
              <h2 className="text-sm font-medium">{game.name}</h2>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
