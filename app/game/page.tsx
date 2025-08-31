'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { getTranslatedConfigs } from '@/app/configs'
import { useTranslation } from '@/hooks/useTranslation'

export default function GamePage() {
  const { t } = useTranslation()
  const games = getTranslatedConfigs(t).games

  return (
    <div className="container px-4 py-4">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap justify-start gap-3 sm:gap-4">
          {games.map(game => (
            <Link
              href={`/game/${game.id}`}
              key={game.id}
              className={`w-26 sm:w-26 lg:w-30 xl:w-30 ${game.hideOnMobile ? 'hidden md:block' : ''}`}
            >
              <Card className="flex aspect-square flex-col items-center justify-center p-3 text-center transition-all hover:-translate-y-1 hover:shadow-md">
                <div className="mb-2 text-2xl sm:text-3xl lg:text-4xl">{game.icon}</div>
                <h2 className="text-sm font-medium sm:text-base lg:text-base">{game.name}</h2>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
